from fastapi import FastAPI, File, UploadFile, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import pandas as pd
import torch
import json
import os
import uuid
import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
from typing import Optional, List, Dict, Any
import onnxruntime as ort
from rapidfuzz import fuzz
import random

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://<YOUR_PROJECT>.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "<SERVICE_ROLE_KEY>")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "<ANON_KEY>")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
MODEL_DIR = os.getenv("MODEL_DIR", "./models")
BEST_MODEL_PATH = os.getenv("BEST_MODEL_PATH", f"{MODEL_DIR}/best.onnx")
BIGBASKET_CSV = os.getenv("BIGBASKET_CSV", "./data/product_catalog.json")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Load product catalog
def load_product_catalog():
    catalog_path = os.path.join(os.path.dirname(__file__), "..", "data", "product_catalog.json")
    with open(catalog_path, 'r') as f:
        return json.load(f)

bigbasket_data = load_product_catalog()
bigbasket_df = pd.DataFrame(bigbasket_data)

# Global ONNX session (load once at startup)
ort_session = None

@app.on_event("startup")
async def load_model():
    global ort_session
    try:
        model_path = os.path.join(os.path.dirname(__file__), "models", "best.onnx")
        if os.path.exists(model_path):
            ort_session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
            print(f"Loaded ONNX model from {model_path}")
        else:
            print(f"Model not found at {model_path}. Using simulation mode.")
    except Exception as e:
        print(f"Error loading model: {e}. Using simulation mode.")

# Base64 decoder function
def decode_base64_image(data_url: str):
    try:
        # Remove data URL prefix if present
        if data_url.startswith('data:image'):
            b64 = data_url.split(',', 1)[1]
        else:
            b64 = data_url
        img = Image.open(BytesIO(base64.b64decode(b64)))
        arr = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        return arr
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

# Preprocess image for model inference
def preprocess_for_model(img_arr):
    # Resize to model input size (e.g., 640x640)
    # In a real implementation, you would match the training preprocessing
    resized = cv2.resize(img_arr, (640, 640))
    # Normalize
    normalized = resized.astype(np.float32) / 255.0
    # Convert HWC to CHW
    chw = np.transpose(normalized, (2, 0, 1))
    # Add batch dimension
    batched = np.expand_dims(chw, axis=0)
    return batched

# Postprocess model outputs
def postprocess(outputs):
    # In a real implementation, you would decode the model outputs
    # to get boxes, classes, and confidences
    # For demo, we'll simulate detections
    return []

# Find product by name with fuzzy matching
def find_product_by_name(product_name: str):
    # First try exact match
    exact_match = bigbasket_df[bigbasket_df['name'].str.lower() == product_name.lower()]
    if not exact_match.empty:
        return exact_match.iloc[0].to_dict()
    
    # Try fuzzy matching
    best_match = None
    best_score = 0
    
    for _, product in bigbasket_df.iterrows():
        score = fuzz.ratio(product_name.lower(), product['name'].lower())
        if score > best_score and score > 70:  # Threshold for fuzzy match
            best_score = score
            best_match = product
    
    return best_match.to_dict() if best_match is not None else None

# Simulate inference for demonstration
def simulate_inference(img_arr):
    """
    Simulate YOLO inference for demonstration purposes
    In a real implementation, this would run the actual model
    """
    # Randomly select a product from our catalog for simulation
    if len(bigbasket_df) > 0 and random.random() > 0.3:  # 70% chance of detection
        product = bigbasket_df.sample(n=1).iloc[0].to_dict()
        confidence = random.uniform(0.7, 0.95)
        return [{
            "name": product["name"],
            "confidence": confidence
        }]
    else:
        return []  # No detection

# Inference with ONNXRuntime
def ort_infer(img_arr):
    # For this simulation, we'll use our simulated inference
    return simulate_inference(img_arr)

# Pydantic models for request/response
class DetectRequest(BaseModel):
    image: str   # dataURL/base64
    user_id: str = None

class DetectResponse(BaseModel):
    status: str
    product_name: Optional[str] = None
    price: Optional[float] = None
    confidence: Optional[float] = None
    message: Optional[str] = None

class TrainNewItemRequest(BaseModel):
    image: str
    label: str
    user_id: str = None

@app.post("/detect-vision", response_model=DetectResponse)
async def detect_vision(req: DetectRequest):
    """
    Detect item using AI vision (YOLOv8) from base64 image
    
    Args:
        req: DetectRequest with image (base64) and user_id
        
    Returns:
        DetectResponse with product details, confidence, and status
    """
    try:
        user_id = req.user_id or "demo-user"
        
        if not req.image:
            return DetectResponse(status="failed", message="No image provided")
        
        # Decode base64 image
        image = decode_base64_image(req.image)
        if image is None:
            return DetectResponse(status="failed", message="Invalid image data")
        
        # Save image temporarily for logging
        img_path = f"temp/{uuid.uuid4()}.jpg"
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        cv2.imwrite(img_path, image)

        # Run inference
        detections = ort_infer(image)
        
        # If no detections, store unknown scan entry
        if not detections:
            # Log unknown detection to Supabase
            unknown_data = {
                "user_id": user_id,
                "image_url": img_path,
                "status": "unknown_item",
                "created_at": "now()"
            }
            try:
                supabase.table("scans").insert(unknown_data).execute()
            except Exception as e:
                print(f"Error logging to Supabase: {e}")
            return DetectResponse(status="unknown_item", message="No product detected")

        # Choose top detection
        top = detections[0]
        product_name = top.get("name", "Unknown")
        confidence = float(top.get("confidence", 0.0))
        
        # Match product name to products table
        product = find_product_by_name(product_name)
        
        # If product found and confidence >= threshold -> success
        if product and confidence >= 0.5:  # Using 0.5 for testing, can tune later
            # Log successful detection to Supabase
            detection_data = {
                "user_id": user_id,
                "product_name": product.get("name"),
                "confidence": confidence,
                "image_url": img_path,
                "status": "success",
                "created_at": "now()"
            }
            try:
                supabase.table("scans").insert(detection_data).execute()
            except Exception as e:
                print(f"Error logging to Supabase: {e}")
            
            # Return product details
            return DetectResponse(
                status="success",
                product_name=product.get("name"),
                price=float(product.get("price", 0)),
                confidence=confidence
            )
        
        # Else unknown item
        # Log low confidence detection to Supabase
        low_confidence_data = {
            "user_id": user_id,
            "product_name": product_name,
            "confidence": confidence,
            "image_url": img_path,
            "status": "unknown_item",
            "created_at": "now()"
        }
        try:
            supabase.table("scans").insert(low_confidence_data).execute()
        except Exception as e:
            print(f"Error logging to Supabase: {e}")
        
        return DetectResponse(
            status="unknown_item",
            product_name=product_name,
            confidence=confidence,
            message="Low confidence detection"
        )
        
    except Exception as e:
        return DetectResponse(status="failed", message=f"Error processing request: {str(e)}")

@app.post("/train-new-item")
async def train_new_item(req: TrainNewItemRequest):
    """
    Add new item to training data for model retraining
    
    Args:
        req: TrainNewItemRequest with image (base64), label, and user_id
        
    Returns:
        JSON with success status
    """
    try:
        user_id = req.user_id or "demo-user"
        
        if not req.image or not req.label:
            return {"status": "failed", "message": "Image and label are required"}
        
        # Decode base64 image
        image = decode_base64_image(req.image)
        if image is None:
            return {"status": "failed", "message": "Invalid image data"}
        
        # Save image to Supabase storage (in a real implementation)
        # For demo, we'll save locally
        img_path = f"training_data/{uuid.uuid4()}.jpg"
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        cv2.imwrite(img_path, image)
        
        # Store training data in Supabase
        training_data = {
            "user_id": user_id,
            "image_url": img_path,
            "label": req.label,
            "added_at": "now()"
        }
        try:
            supabase.table("training_data").insert(training_data).execute()
        except Exception as e:
            print(f"Error logging to Supabase: {e}")
        
        return {
            "status": "success", 
            "message": "Item added to training data successfully"
        }
        
    except Exception as e:
        return {"status": "failed", "message": f"Error processing request: {str(e)}"}

@app.get("/get-products")
async def get_products():
    """
    Fetch BigBasket product catalog
    
    Returns:
        JSON with product catalog
    """
    try:
        # In a real implementation, fetch from Supabase
        # For demo, we'll return the loaded DataFrame
        products = bigbasket_df.to_dict('records')
        return {"status": "success", "products": products}
    except Exception as e:
        return {"status": "failed", "message": f"Error fetching products: {str(e)}"}

@app.post("/update-feedback")
async def update_feedback(
    user_id: str = Form(...),
    image_url: str = Form(...),
    label: str = Form(...),
    user_feedback: bool = Form(...),
):
    """
    Store user feedback for retraining
    
    Args:
        user_id: User identifier
        image_url: URL of the image
        label: Product label or "incorrect"
        user_feedback: Whether the detection was correct
        
    Returns:
        JSON with success status
    """
    try:
        # Store feedback in Supabase
        feedback_data = {
            "user_id": user_id,
            "image_url": image_url,
            "label": label,
            "user_feedback": user_feedback,
            "added_at": "now()"
        }
        
        try:
            supabase.table("training_data").insert(feedback_data).execute()
        except Exception as e:
            print(f"Error logging to Supabase: {e}")
        
        return {"status": "success", "message": "Feedback recorded successfully"}
    except Exception as e:
        return {"status": "failed", "message": f"Error recording feedback: {str(e)}"}

@app.post("/train-model")
async def train_model():
    """
    Retrain YOLOv8 model with new user feedback data
    
    Returns:
        JSON with training status and metrics
    """
    try:
        # In a real implementation, this would:
        # 1. Fetch new training data from Supabase
        # 2. Retrain the YOLO model
        # 3. Save performance metrics to Supabase
        
        # For demo, we'll simulate the process
        print("Starting model retraining...")
        
        # Simulate training process
        import time
        time.sleep(2)  # Simulate training time
        
        # Simulate metrics
        metrics = {
            "model_name": "bigbasket_yolo",
            "map50": 0.87,
            "map95": 0.65,
            "accuracy": 0.82,
            "trained_at": "now()"
        }
        
        # Save metrics to Supabase
        try:
            supabase.table("model_metrics").insert(metrics).execute()
        except Exception as e:
            print(f"Error logging to Supabase: {e}")
        
        return {
            "status": "success", 
            "message": "Model retrained successfully",
            "metrics": metrics
        }
    except Exception as e:
        return {"status": "failed", "message": f"Error during training: {str(e)}"}

@app.post("/detect-item")
async def detect_item(barcode: str = Form(None), file: UploadFile = File(None)):
    """
    Detect item from either barcode or image
    
    Args:
        barcode: Product barcode string
        file: Image file for visual recognition
        
    Returns:
        JSON with product details and success message
    """
    try:
        if barcode:
            # Barcode lookup
            product = bigbasket_df[bigbasket_df["barcode"] == barcode]
            if product.empty:
                return {"message": "Item not found", "product": None}
            product = product.iloc[0].to_dict()
        else:
            # Image recognition with YOLO
            # In a real implementation:
            # 1. Save uploaded file temporarily
            # 2. Run YOLO detection
            # 3. Match detected object with product catalog
            
            # For demo, we'll simulate detection
            # detected_object = run_yolo_detection(file)
            # product = match_with_catalog(detected_object)
            
            # Simulate finding a random product for demo
            product = bigbasket_df.sample(n=1).iloc[0].to_dict()
        
        # Insert scan record into Supabase
        scan_data = {
            "user_id": "demo-user",  # In real app, get from auth context
            "product_name": product["name"],
            "confidence": 0.95,  # In real app, get from detection
            "qty": 1,
            "created_at": "now()"
        }
        
        try:
            # supabase.table("scans").insert(scan_data).execute()
            pass  # Commented out for demo
        except Exception as e:
            print(f"Error logging to Supabase: {e}")
        
        # Update cart in Supabase
        cart_entry = {
            "user_id": "demo-user",
            "product_name": product["name"],
            "qty": 1,
            "total_price": float(product["price"])
        }
        
        # supabase.table("cart").upsert(cart_entry).execute()
        
        return {
            "message": "Item detected successfully", 
            "product": {
                "product_name": product["name"],
                "price": product["price"],
                "quantity": 1,
                "confidence": 0.95,
                "size": product.get("size", ""),
                "product_id": product["product_id"]
            }
        }
        
    except Exception as e:
        return {"message": f"Error processing request: {str(e)}", "product": None}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)