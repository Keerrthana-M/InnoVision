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

### ✅ Gamified User Experience
- Voice feedback using Web Speech API
- Confidence color indicators (green = >90%, yellow = 70–90%, red = <70%)
- Auto-capture every 3 seconds
- Real-time cart update after product confirmation

### ✅ Edge Inference Optimization
- ONNX export for optimized edge inference
- TensorRT support for faster processing (if available)

## Implementation Details

### 1. Smart Vision Scan Component
Located at `src/pages/SmartVisionScan.tsx`, this component:
- Accesses device camera for real-time scanning
- Captures images and sends to backend for processing
- Displays detection results with confidence scores
- Provides feedback mechanism for model improvement
- Includes auto-capture functionality (every 3 seconds)
- Voice feedback for accessibility
- Real-time cart updates

### 2. Backend Vision API
Located at `ai_checkout/api/main.py`, the endpoints:
- `/detect-vision`: Receives image → runs YOLOv8 detection → returns product name + confidence
- `/train-model`: Retrains YOLOv8 with new user feedback data
- `/get-products`: Fetches BigBasket dataset
- `/update-feedback`: Stores feedback in Supabase
- `/detect-item`: Legacy endpoint for barcode and image recognition
- `/health`: Server status check

### 3. Model Training
Located at `ai_checkout/api/train_model.py`:
- Initial training on BigBasket dataset
- Retraining with user feedback data
- Performance metrics logging
- Model export for production use (PyTorch, ONNX, TensorRT)

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
  user_id TEXT,
  image_url TEXT,
  label TEXT,
  user_feedback BOOLEAN,
  added_at TIMESTAMP
);
```

## How to Run

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup
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

### Export for Edge Inference
```bash
cd ai_checkout/api
python train_model.py --export
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

## API Endpoints

### POST /detect-vision
Detect product using AI vision from uploaded image

**Parameters:**
- `user_id` (form): User identifier
- `file` (form): Image file for visual recognition

**Response:**
```json
{
  "status": "success",
  "product": {
    "id": "product_id",
    "name": "Product Name",
    "price": 20.0,
    "category": "Category"
  },
  "confidence": 0.93
}
```

### GET /get-products
Fetch BigBasket product catalog

**Response:**
```json
{
  "status": "success",
  "products": [
    {
      "id": "product_id",
      "name": "Product Name",
      "price": 20.0,
      "category": "Category"
    }
  ]
}
```

### POST /update-feedback
Store user feedback for retraining

**Parameters:**
- `user_id` (form): User identifier
- `image_url` (form): URL of the image
- `label` (form): Product label or "incorrect"
- `user_feedback` (form): Whether the detection was correct

**Response:**
```json
{
  "status": "success",
  "message": "Feedback recorded successfully"
}
```

### POST /train-model
Retrain YOLOv8 model with new user feedback data

**Response:**
```json
{
  "status": "success",
  "message": "Model retrained successfully",
  "metrics": {
    "model_name": "bigbasket_yolo",
    "map50": 0.87,
    "map95": 0.65,
    "epoch": 50,
    "trained_at": "2023-01-01T00:00:00Z"
  }
}
```

## Result

After running this implementation:
✅ Your camera replaces barcode scanning
✅ The AI model recognizes products visually
✅ Supabase stores every scan + feedback
✅ The system retrains itself automatically with real user data
✅ Model accuracy improves weekly with no manual retraining
✅ Voice feedback enhances accessibility
✅ Auto-capture improves user experience
✅ Edge inference optimization enables faster processing