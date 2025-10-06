from ultralytics import YOLO
import yaml
import os
from supabase import create_client
from datetime import datetime
import argparse
import pandas as pd

# Supabase configuration
SUPABASE_URL = "https://iaqyggcjvrprevburnjy.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcXlnZ2NqdnJwcmV2YnVybmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTczMTA4NywiZXhwIjoyMDc1MzA3MDg3fQ.fQu1-6VQsYCl24ZWDmi0e2D4qgQpUlvwdgikOIEnDs0"

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def create_data_yaml():
    """Create YOLO data configuration file"""
    # Auto-generate data config
    data_yaml = {
        "train": "./data/train/images",
        "val": "./data/val/images",
        "nc": 0,  # Will be updated after checking folders
        "names": []
    }
    
    # Count classes and get names
    if os.path.exists("./data/train/images"):
        class_names = os.listdir("./data/train/images")
        data_yaml["nc"] = len(class_names)
        data_yaml["names"] = class_names
    
    with open("bigbasket.yaml", "w") as f:
        yaml.dump(data_yaml, f)
    
    return data_yaml

def download_image(image_url, save_path):
    """Download image from URL and save to path"""
    # In a real implementation, you would download the image
    # For now, we'll just create a placeholder
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "w") as f:
        f.write("placeholder")

def train_model():
    """Train YOLO model on BigBasket dataset"""
    print("Creating data configuration...")
    data_config = create_data_yaml()
    print(f"Found {data_config['nc']} classes: {data_config['names']}")
    
    # Load pre-trained YOLO model
    print("Loading pre-trained YOLO model...")
    model = YOLO("yolov8m.pt")  # Using YOLOv8m for better accuracy
    
    # Train the model
    print("Starting training...")
    results = model.train(
        data="bigbasket.yaml",
        epochs=50,
        imgsz=640,
        batch_size=16,
        name="bigbasket_yolo"
    )
    
    # Validate the model
    print("Validating model...")
    metrics = model.val()
    
    # Save metrics to Supabase
    print("Saving training metrics to Supabase...")
    supabase.table("model_metrics").insert({
        "model_name": "bigbasket_yolo",
        "map50": float(metrics.box.map50) if metrics.box.map50 else 0.0,
        "map95": float(metrics.box.map) if metrics.box.map else 0.0,
        "epoch": 50,
        "trained_at": datetime.now().isoformat()
    }).execute()
    
    # Export model in multiple formats for optimized inference
    print("Exporting model...")
    model.export(format="pt", path="./models/bigbasket_yolo.pt")  # PyTorch
    model.export(format="onnx", path="./models/bigbasket_yolo.onnx")  # ONNX for edge inference
    
    print("Training completed successfully!")

def retrain_with_user_data():
    """Retrain model with user feedback data"""
    print("Fetching user training data from Supabase...")
    
    # Get new training data from Supabase
    response = supabase.table("training_data").select("*").execute()
    new_data = response.data if response.data else []
    
    if not new_data:
        print("No new training data found.")
        return
    
    print(f"Found {len(new_data)} new training samples")
    
    # Create directories for new data if they don't exist
    os.makedirs("./data/train/images", exist_ok=True)
    
    # Process each training sample
    for row in new_data:
        # In a real implementation, you would download the image and organize it
        # For now, we'll just log what would be done
        print(f"Processing training sample: {row['id']} with label {row['label']}")
        # download_image(row['image_url'], f"./data/train/{row['label']}/")
    
    # Retrain the model
    print("Retraining model with new data...")
    train_model()
    
    print("Retraining completed!")

def export_for_edge_inference():
    """Export model for optimized edge inference"""
    print("Exporting model for edge inference...")
    
    # Load the trained model
    model = YOLO("./models/bigbasket_yolo.pt")
    
    # Export to ONNX format for optimized inference
    model.export(format="onnx", path="./models/bigbasket_yolo.onnx")
    
    # Export to TensorRT format (if available)
    try:
        model.export(format="engine", path="./models/bigbasket_yolo.engine")
        print("TensorRT export completed.")
    except Exception as e:
        print(f"TensorRT export failed: {e}")
        print("ONNX export completed.")
    
    print("Edge inference models exported successfully!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLO model for BigBasket product recognition")
    parser.add_argument("--retrain", action="store_true", help="Retrain with user feedback data")
    parser.add_argument("--export", action="store_true", help="Export model for edge inference")
    
    args = parser.parse_args()
    
    if args.retrain:
        retrain_with_user_data()
    elif args.export:
        export_for_edge_inference()
    else:
        train_model()