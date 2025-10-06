# AI Visual Product Recognition System

This implementation provides a complete AI-powered visual product recognition system that replaces traditional barcode scanning with camera-based detection using YOLOv8.

## System Architecture

### Frontend (React/TypeScript)
- **SmartVisionScan.tsx**: Camera-based scanning interface with AI feedback loop
- **scanService.ts**: Service layer for backend communication and Supabase integration

### Backend (FastAPI/Python)
- **main.py**: FastAPI server with vision detection endpoint
- **train_model.py**: Model training and retraining scripts
- **requirements.txt**: Python dependencies

### AI/ML Components
- **YOLOv8**: Object detection model for product recognition
- **BigBasket Dataset**: Training data for initial model
- **Self-learning Loop**: Continuous improvement with user feedback

## Key Features

### ✅ Camera-Based Product Recognition
- Real-time camera access for product detection
- Visual feedback during scanning process
- Confidence scoring for detection accuracy

### ✅ AI Feedback Loop
- User confirmation system for detection accuracy
- Training data collection from real-world scans
- Automatic model retraining with new data

### ✅ Supabase Integration
- **products**: Base product catalog
- **scans**: Detection events with confidence scores
- **cart**: Active shopping cart with upsert logic
- **purchase_history**: Completed transactions
- **model_metrics**: AI training performance metrics
- **training_data**: User feedback for retraining

### ✅ Self-Learning Capabilities
- Automatic collection of user feedback
- Periodic model retraining with real-world data
- Performance metrics tracking

## Implementation Details

### 1. Smart Vision Scan Component
Located at `src/pages/SmartVisionScan.tsx`, this component:
- Accesses device camera for real-time scanning
- Captures images and sends to backend for processing
- Displays detection results with confidence scores
- Provides feedback mechanism for model improvement

### 2. Backend Vision API
Located at `ai_checkout/api/main.py`, the `/detect-vision` endpoint:
- Receives image uploads from frontend
- Processes images with YOLOv8 model
- Matches detected objects with product catalog
- Logs scan data to Supabase
- Returns product information to frontend

### 3. Model Training
Located at `ai_checkout/api/train_model.py`:
- Initial training on BigBasket dataset
- Retraining with user feedback data
- Performance metrics logging
- Model export for production use

## Database Schema

### Products Table
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT,
  price DECIMAL,
  category TEXT,
  image_url TEXT
);
```

### Scans Table
```sql
CREATE TABLE scans (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  product_id TEXT,
  confidence DECIMAL,
  image_url TEXT,
  created_at TIMESTAMP
);
```

### Cart Table
```sql
CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  product_id TEXT,
  qty INTEGER,
  total_price DECIMAL
);
```

### Purchase History Table
```sql
CREATE TABLE purchase_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  items JSON,
  total_amount DECIMAL,
  date TIMESTAMP
);
```

### Model Metrics Table
```sql
CREATE TABLE model_metrics (
  id SERIAL PRIMARY KEY,
  model_name TEXT,
  map50 DECIMAL,
  map95 DECIMAL,
  epoch INTEGER,
  trained_at TIMESTAMP
);
```

### Training Data Table
```sql
CREATE TABLE training_data (
  id SERIAL PRIMARY KEY,
  image_url TEXT,
  label TEXT,
  user_feedback BOOLEAN,
  added_at TIMESTAMP
);
```

## How to Run

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd ai_checkout/api
pip install -r requirements.txt
uvicorn main:app --reload
```

### Model Training
```bash
cd ai_checkout/api
python train_model.py
```

### Retraining with User Data
```bash
cd ai_checkout/api
python train_model.py --retrain
```

## Model Enhancement Suggestions

1. **Use YOLOv8m or YOLOv8x** for better accuracy (>90% mAP@50)
2. **Add Color Histogram + ORB Features** (OpenCV) as backup matcher
3. **Save camera stream frames** every 2s for auto-detection (no manual click)
4. **Implement multi-object detection** (detect multiple items at once)
5. **Normalize product names** before lookup ("Lays Salted Chips" == "Lay's Classic")
6. **Cache previous 10 results** to speed up next detection
7. **Add Edge Inference Mode** using ONNX Runtime for local speed

## Deployment Notes

| Component | Hosting | Notes |
|-----------|---------|-------|
| Frontend | Vercel / Netlify | React App |
| Backend | Render / FastAPI | GPU instance for inference |
| Supabase | Managed | Stores all product + training data |
| Model Storage | Supabase Storage / S3 | Save YOLO weights |

## Example Output

```json
{
  "status": "success",
  "product": {
    "name": "Lay's Salted Classic Chips 52g",
    "price": 20,
    "category": "Snacks"
  },
  "confidence": 0.93,
  "feedback_prompt": "Is this product correct?"
}
```

## Result

After running this implementation:
✅ Your camera replaces barcode scanning
✅ The AI model recognizes products visually
✅ Supabase stores every scan + feedback
✅ The system retrains itself automatically with real user data
✅ Model accuracy improves weekly with no manual retraining