# AI Smart Vision Scan System - Production Documentation

## Overview
This document provides instructions for setting up, running, and maintaining the AI Smart Vision Scan System, a production-ready solution for real-time product recognition using computer vision and machine learning.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Supabase      │
│  (React/TS)     │◄──►│  (FastAPI)       │◄──►│  (Database)     │
│                 │    │                  │    │                 │
│ • Camera UI     │    │ • ONNX Inference │    │ • Products      │
│ • Scan Control  │    │ • Image Decode   │    │ • Scans         │
│ • Feedback      │    │ • Retraining     │    │ • Training Data │
│ • Voice Output  │    │ • Supabase Sync  │    │ • Model Metrics │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              ▲
                              │
                    ┌─────────┴──────────┐
                    │  Model Storage     │
                    │  (ONNX Models)     │
                    └────────────────────┘
```

## Prerequisites

### Backend Requirements
- Python 3.8+
- pip package manager
- Supabase account and project
- ONNX Runtime for model inference
- Access to GPU (recommended for inference)

### Frontend Requirements
- Node.js 14+
- npm or yarn
- Modern web browser with camera support

## Setup Instructions

### 1. Backend Setup

1. Navigate to the API directory:
```bash
cd ai_checkout/api
```

2. Install dependencies:
```bash
pip install -r requirements_prod.txt
```

3. Set environment variables:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_ANON_KEY="your-anon-key"
export API_BASE_URL="http://localhost:8000"
export MODEL_DIR="./models"
export BEST_MODEL_PATH="./models/best_model.onnx"
export BIGBASKET_CSV="../data/product_catalog.json"
```

4. Start the FastAPI server:
```bash
python main.py
```

### 2. Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `ai_checkout/supabase_schema.sql`
3. Load the BigBasket product data into the `products` table
4. Configure storage buckets for images if needed

## API Endpoints

### Detection
- `POST /detect-vision` - Detect products from base64 image
  - Request: `{ "image": "base64_data", "user_id": "user123" }`
  - Response: `{ "status": "success", "product_name": "Lays Chips", "price": 20.0, "confidence": 0.93 }`

### Training
- `POST /train-new-item` - Add new item to training data
- `POST /train-model` - Trigger model retraining
- `POST /update-feedback` - Store user feedback

### Data
- `GET /get-products` - Fetch product catalog
- `GET /health` - Health check endpoint

## Model Training Pipeline

### Running the Training Pipeline

1. Navigate to the training directory:
```bash
cd ai_checkout
```

2. Run the training pipeline:
```bash
python train_pipeline.py
```

### Training Process

1. **Data Preparation**: Combines BigBasket dataset with user training data
2. **Data Augmentation**: Applies transformations using albumentations
3. **Model Training**: Trains YOLOv8 model with early stopping
4. **Model Evaluation**: Evaluates on validation set (mAP50, mAP95, accuracy)
5. **Model Export**: Exports best model to ONNX format
6. **Metrics Update**: Stores performance metrics in Supabase
7. **Model Deployment**: Updates production model

## Frontend Features

### Camera Controls
- **Scan Product**: Manual trigger for product detection
- **Auto Capture**: Automatic scanning every 3 seconds
- **Reset Camera**: Restart camera feed
- **Close Camera**: Stop camera and release resources

### Detection Results
- **Success Display**: Shows product name, price, and confidence
- **Add to Cart**: Button to add detected product to shopping cart
- **Unknown Item**: Prompt to add new items to training data
- **Voice Feedback**: Audio notifications for all actions

### User Experience
- **Loading States**: Visual indicators during processing
- **Error Handling**: Clear messages for all error conditions
- **Responsive Design**: Works on mobile and desktop devices

## Supabase Schema

### Tables
1. **products**: BigBasket product catalog
2. **scans**: All detection attempts with results
3. **training_data**: User-submitted images for retraining
4. **model_metrics**: Performance metrics for trained models
5. **cart**: User shopping cart
6. **purchase_history**: User purchase records

### Key Relationships
- `scans.product_id` → `products.id`
- `cart.product_id` → `products.id`

## Performance Optimization

### Model Inference
- **ONNX Runtime**: Optimized inference engine
- **Model Caching**: ONNX model loaded once at startup
- **Preprocessing**: Efficient image resizing and normalization
- **Batch Processing**: Support for multiple concurrent requests

### Database Optimization
- **Indexing**: Strategic indexes on frequently queried columns
- **Connection Pooling**: Reuse database connections
- **Async Operations**: Non-blocking database queries

## Monitoring and Maintenance

### Health Checks
- API health endpoint at `/health`
- Model loading status at startup
- Database connectivity verification

### Logging
- Error logging for all failed operations
- Performance metrics for inference times
- User activity tracking

### Retraining Schedule
- **Manual Trigger**: Via `/train-model` endpoint
- **Scheduled**: Recommended nightly or weekly retraining
- **Threshold-Based**: Retrain when sufficient new data is available

## Troubleshooting

### Common Issues

1. **Camera Not Accessible**
   - Check browser permissions
   - Ensure HTTPS in production
   - Verify camera hardware

2. **Model Not Loading**
   - Check `BEST_MODEL_PATH` environment variable
   - Verify ONNX model file exists
   - Check model compatibility with ONNX Runtime

3. **Supabase Connection Errors**
   - Verify `SUPABASE_URL` and keys
   - Check network connectivity
   - Confirm Supabase project status

4. **Slow Inference**
   - Check GPU availability
   - Optimize image preprocessing
   - Consider model quantization

### Debugging Checklist

1. Verify model path and metrics at FastAPI startup
2. Test with sample images using `test_infer.py`
3. Check class names match product catalog entries
4. Validate preprocessing matches training pipeline
5. Inspect saved images in storage for encoding issues

## Security Considerations

### API Security
- CORS configuration for frontend domains
- Rate limiting for API endpoints
- Input validation for all requests

### Data Privacy
- Secure storage of user data
- Access controls for Supabase tables
- Encryption for sensitive information

### Model Security
- Secure model storage
- Access controls for training data
- Regular security audits

## Scaling Considerations

### Horizontal Scaling
- Multiple FastAPI workers
- Load balancing for API requests
- Database connection pooling

### Model Serving
- GPU clusters for inference
- Model versioning
- A/B testing for new models

### Data Management
- Archival of old scan data
- Partitioning of large tables
- Backup and recovery procedures

## Future Enhancements

1. **Multi-Model Support**: Integration with ResNet and EfficientNet
2. **Edge Computing**: On-device inference capabilities
3. **Advanced Analytics**: Detection performance dashboards
4. **Mobile App**: Native mobile application
5. **TensorRT Export**: Further optimization for production