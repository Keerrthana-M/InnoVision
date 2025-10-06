from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import pandas as pd
import torch
import json
import os
import uuid
from typing import Optional, List

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = "https://iaqyggcjvrprevburnjy.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcXlnZ2NqdnJwcmV2YnVybmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTczMTA4NywiZXhwIjoyMDc1MzA3MDg3fQ.fQu1-6VQsYCl24ZWDmi0e2D4qgQpUlvwdgikOIEnDs0"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Load product catalog (in a real app, this would be in Supabase)
# For demo purposes, we'll load from the JSON file
def load_product_catalog():
    catalog_path = os.path.join(os.path.dirname(__file__), "..", "data", "product_catalog.json")
    with open(catalog_path, 'r') as f:
        return json.load(f)

bigbasket_df = pd.DataFrame(load_product_catalog())

# Load YOLO model (in a real app, you'd load this once at startup)
# For demo, we'll simulate the model
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s')

@app.post("/detect-vision")
async def detect_vision(user_id: str = Form(...), file: UploadFile = File(...)):
    """
    Detect item using AI vision (YOLOv8) from uploaded image
    
    Args:
        user_id: User identifier
        file: Image file for visual recognition
        
    Returns:
        JSON with product details, confidence, and success status
    """
    try:
        # Save uploaded file temporarily
        contents = await file.read()
        img_path = f"temp/{uuid.uuid4()}.jpg"
        
        # Create temp directory if it doesn't exist
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        
        with open(img_path, "wb") as f:
            f.write(contents)

        # In a real implementation, run YOLO detection
        # results = model(img_path)
        # boxes = results[0].boxes.data
        # if len(boxes) == 0:
        #     return {"status": "failed", "message": "No product detected"}
        #
        # best_box = boxes[0]
        # class_id = int(best_box[5])
        # confidence = float(best_box[4])
        # product_name = model.names[class_id]
        #
        # product = bigbasket_df[
        #     bigbasket_df['product_name'].str.contains(product_name, case=False, na=False)
        # ].iloc[0].to_dict()

        # For demo, we'll simulate detection with a random product
        product = bigbasket_df.sample(n=1).iloc[0].to_dict()
        confidence = 0.93  # Simulated confidence
        
        # Log scan to Supabase
        scan_data = {
            "user_id": user_id,
            "product_id": product["product_id"],
            "confidence": confidence,
            "image_url": img_path,
            "created_at": "now()"
        }
        
        supabase.table("scans").insert(scan_data).execute()

        # Prepare response
        response_data = {
            "status": "success",
            "product": {
                "id": product["product_id"],
                "name": product["name"],
                "price": float(product["price"]),
                "category": product.get("category", "Unknown"),
            },
            "confidence": confidence
        }
        
        return response_data
        
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
        
        supabase.table("training_data").insert(feedback_data).execute()
        
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
            "epoch": 50,
            "trained_at": "now()"
        }
        
        # Save metrics to Supabase
        supabase.table("model_metrics").insert(metrics).execute()
        
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
            "product_id": product["product_id"],
            "confidence": 0.95,  # In real app, get from detection
            "qty": 1,
            "created_at": "now()"
        }
        
        # supabase.table("scans").insert(scan_data).execute()
        
        # Update cart in Supabase
        cart_entry = {
            "user_id": "demo-user",
            "product_id": product["product_id"],
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