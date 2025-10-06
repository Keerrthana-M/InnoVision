#!/usr/bin/env python3
"""
Demo Script for AI Visual Product Recognition System

This script demonstrates the core functionality of the AI system
without requiring the full backend infrastructure.
"""

import os
import sys
import json
from datetime import datetime

def demo_yolo_detection(image_path):
    """
    Simulate YOLO detection on an image
    In a real implementation, this would use the actual YOLO model
    """
    print(f"🤖 AI Processing image: {image_path}")
    
    # Simulate processing time
    import time
    time.sleep(2)
    
    # Simulate detection results
    # In a real implementation, this would come from YOLO model
    products = [
        {
            "name": "Lay's Classic Potato Chips",
            "category": "Snacks",
            "price": 20.0,
            "confidence": 0.93
        },
        {
            "name": "Kellogg's Corn Flakes",
            "category": "Breakfast",
            "price": 45.5,
            "confidence": 0.87
        },
        {
            "name": "Nestle Milkmaid",
            "category": "Dairy",
            "price": 120.0,
            "confidence": 0.91
        }
    ]
    
    # Return a random product for demo
    import random
    return random.choice(products)

def log_to_supabase(scan_data):
    """
    Simulate logging to Supabase
    In a real implementation, this would use the Supabase client
    """
    print("💾 Logging to Supabase:")
    print(json.dumps(scan_data, indent=2))

def collect_feedback(product_name):
    """
    Simulate collecting user feedback
    In a real implementation, this would be done through the frontend
    """
    print(f"\n🤔 Is '{product_name}' correct?")
    feedback = input("Enter 'y' for yes, 'n' for no: ").lower().strip()
    return feedback == 'y'

def main():
    print("🚀 AI Visual Product Recognition System - Demo")
    print("=" * 50)
    
    # Check if image path is provided
    if len(sys.argv) < 2:
        print("📸 Simulating camera capture...")
        # In a real app, this would be an actual image from the camera
        image_path = "demo_image.jpg"
        print(f"📷 Captured image: {image_path}")
    else:
        image_path = sys.argv[1]
        if not os.path.exists(image_path):
            print(f"❌ Image not found: {image_path}")
            return
    
    # Simulate YOLO detection
    print("\n🔍 Running AI detection...")
    detected_product = demo_yolo_detection(image_path)
    
    # Display results
    print(f"\n✅ Detection Complete!")
    print(f"📦 Product: {detected_product['name']}")
    print(f"🏷️  Category: {detected_product['category']}")
    print(f"💰 Price: ₹{detected_product['price']}")
    print(f"📈 Confidence: {detected_product['confidence']:.2%}")
    
    # Log to Supabase
    scan_data = {
        "user_id": "demo_user",
        "product_name": detected_product['name'],
        "confidence": detected_product['confidence'],
        "image_url": image_path,
        "timestamp": datetime.now().isoformat()
    }
    log_to_supabase(scan_data)
    
    # Collect feedback
    is_correct = collect_feedback(detected_product['name'])
    
    # Log feedback
    feedback_data = {
        "user_id": "demo_user",
        "image_url": image_path,
        "label": detected_product['name'] if is_correct else "incorrect",
        "user_feedback": is_correct,
        "timestamp": datetime.now().isoformat()
    }
    
    print(f"\n{'✅' if is_correct else '❌'} Feedback logged to Supabase:")
    print(json.dumps(feedback_data, indent=2))
    
    print(f"\n🎯 {'Thank you for helping improve our AI!' if is_correct else 'Thank you for the feedback! We will use this to improve our recognition.'}")
    
    # Show retraining message
    print("\n🔄 With enough feedback like this, our system automatically retrains to improve accuracy!")

if __name__ == "__main__":
    main()