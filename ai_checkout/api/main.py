from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import pandas as pd
import torch
import json
import os

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
# model = torch.hub.load('ultralytics/yolov5', 'yolov5s')

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