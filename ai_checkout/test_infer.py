#!/usr/bin/env python3
"""
Test Inference Script for AI Smart Vision Scan System

This script sends sample images to the /detect-vision endpoint
and logs the results for debugging and verification.
"""

import os
import json
import base64
import requests
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import pandas as pd
import uuid

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
BIGBASKET_CSV = os.getenv("BIGBASKET_CSV", "./data/product_catalog.json")
TEST_IMAGES_DIR = os.getenv("TEST_IMAGES_DIR", "./test_images")

def load_bigbasket_data():
    """Load BigBasket product catalog."""
    with open(BIGBASKET_CSV, 'r') as f:
        return json.load(f)

def create_sample_image(product_name: str, size: tuple = (640, 480)) -> str:
    """Create a sample image with text and encode as base64."""
    # Create a blank image
    img = np.zeros((size[1], size[0], 3), dtype=np.uint8)
    img[:] = (255, 255, 255)  # White background
    
    # Add text
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, product_name, (50, size[1]//2), font, 1, (0, 0, 0), 2)
    
    # Encode as JPEG
    _, buffer = cv2.imencode('.jpg', img)
    
    # Convert to base64
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{jpg_as_text}"

def send_detection_request(image_base64: str, user_id: str = "test_user") -> dict:
    """Send detection request to API."""
    url = f"{API_BASE_URL}/detect-vision"
    payload = {
        "image": image_base64,
        "user_id": user_id
    }
    
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        print(f"Error sending request: {e}")
        return {"status": "error", "message": str(e)}

def test_sample_images():
    """Test with sample images from BigBasket dataset."""
    print("Loading BigBasket dataset...")
    products = load_bigbasket_data()
    
    print(f"Loaded {len(products)} products")
    
    # Test with first 5 products
    test_products = products[:5]
    
    results = []
    for i, product in enumerate(test_products):
        product_name = product.get("name", "Unknown")
        print(f"\nTesting product {i+1}/{len(test_products)}: {product_name}")
        
        # Create sample image
        image_base64 = create_sample_image(product_name)
        
        # Send detection request
        result = send_detection_request(image_base64)
        results.append({
            "product_name": product_name,
            "result": result
        })
        
        print(f"Result: {result}")
        
        # Add delay to avoid overwhelming the API
        import time
        time.sleep(1)
    
    # Print summary
    print("\n=== TEST SUMMARY ===")
    success_count = 0
    unknown_count = 0
    error_count = 0
    
    for result in results:
        status = result["result"].get("status", "error")
        if status == "success":
            success_count += 1
            print(f"✓ {result['product_name']}: {result['result'].get('product_name')} - ₹{result['result'].get('price')}")
        elif status == "unknown_item":
            unknown_count += 1
            print(f"? {result['product_name']}: Unknown item")
        else:
            error_count += 1
            print(f"✗ {result['product_name']}: {result['result'].get('message', 'Error')}")
    
    print(f"\nSummary: {success_count} success, {unknown_count} unknown, {error_count} errors")

def test_edge_cases():
    """Test edge cases."""
    print("\n=== TESTING EDGE CASES ===")
    
    # Test with empty image
    print("Testing empty image...")
    empty_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAAHCf/EABYRAQEBAAAAAAAAAAAAAAAAAAABAf/aAAwDAQACEQMRAD8AfwD/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAh//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/Agf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/Ah//2Q=="
    result = send_detection_request(empty_image)
    print(f"Empty image result: {result}")
    
    # Test with invalid base64
    print("Testing invalid base64...")
    result = send_detection_request("invalid_base64_data")
    print(f"Invalid base64 result: {result}")
    
    # Test without image
    print("Testing without image...")
    result = send_detection_request("")
    print(f"No image result: {result}")

if __name__ == "__main__":
    print("Starting AI Smart Vision Scan System Test")
    print(f"API Base URL: {API_BASE_URL}")
    
    # Test sample images
    test_sample_images()
    
    # Test edge cases
    test_edge_cases()
    
    print("\nTest completed!")