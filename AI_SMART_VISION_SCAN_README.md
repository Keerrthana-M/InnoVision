# AI Smart Vision Scan System

## Overview
The AI Smart Vision Scan System is a production-grade, self-improving product recognition solution that uses computer vision and machine learning to identify products from camera feeds. This system features full integration with Supabase for data storage and YOLOv8 for object detection.

## Key Features

### Frontend (React + TypeScript)
- **Camera Management**: Reliable camera initialization, control, and cleanup
- **Image Capture**: Optimized frame capture with 640×480 resizing
- **Real-time Detection**: Live product recognition with confidence scoring
- **User Feedback**: Voice and visual feedback for all interactions
- **Self-Learning Interface**: "Add to Training" functionality for unknown items
- **Responsive UI**: Mobile-friendly interface with loading states

### Backend (FastAPI + Supabase + YOLOv8)
- **YOLOv8 Integration**: Ready for state-of-the-art object detection
- **Base64 Processing**: Robust image decoding and processing
- **Confidence Filtering**: Automatic filtering of low-confidence detections
- **Dynamic Retraining**: Automatic model retraining with new data
- **Supabase Integration**: Full data storage and retrieval capabilities

### Self-Learning Capabilities
- **Unknown Item Handling**: Prompts users to label unrecognized products
- **Training Data Collection**: Stores user-labeled images for model improvement
- **Automatic Retraining**: Scheduled model retraining with new data
- **Model Promotion**: Automatically promotes better-performing models

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Supabase      │
│  (React/TS)     │◄──►│  (FastAPI)       │◄──►│  (Database)     │
│                 │    │                  │    │                 │
│ • Camera UI     │    │ • YOLOv8         │    │ • Products      │
│ • Scan Control  │    │ • Image Decode   │    │ • Detections    │
│ • Feedback      │    │ • Confidence     │    │ • Training Data │
│ • Voice Output  │    │ • Retraining     │    │ • Model Metrics │
└─────────────────┘    │ • Supabase Sync  │    │ • Users         │
                       └──────────────────┘    └─────────────────┘
```

## API Endpoints

### Detection
- `POST /detect-vision` - Detect products from base64 image
- `POST /detect-item` - Detect products from uploaded image or barcode

### Training
- `POST /train-new-item` - Add new item to training data
- `POST /update-feedback` - Store user feedback for retraining
- `POST /train-model` - Trigger model retraining

### Data
- `GET /get-products` - Fetch product catalog
- `GET /health` - Health check endpoint

## Supabase Tables

### products
Product catalog with metadata

### detections
Logs of all detection attempts with confidence scores

### training_data
User-labeled images for model retraining

### model_metrics
Performance metrics for trained models

## Setup Instructions

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd ai_checkout/api
pip install -r requirements_updated.txt
python main.py
```

## Usage Workflow

1. **User Scans Product**: Point camera at product and tap "Scan"
2. **System Detects**: AI identifies product with confidence score
3. **High Confidence**: If confidence > 0.8, product is added to cart
4. **Low Confidence**: If confidence < 0.8, user is prompted to reposition or add to training
5. **Unknown Item**: If item not in database, user can label it for training
6. **Retraining**: System automatically retrains with new data nightly
7. **Model Update**: Better models are automatically promoted to production

## Confidence Levels

- 🟢 **High (0.9-1.0)**: Very confident detection
- 🟡 **Medium (0.7-0.9)**: Moderately confident detection
- 🔴 **Low (<0.7)**: Low confidence, requires user action

## Voice Feedback

- **Success**: "Lay's Chips detected with 93% confidence!"
- **Low Confidence**: "Low confidence. Please hold the product closer."
- **Unknown Item**: "Unknown item. Please confirm label."
- **Training Added**: "Item added to training data. Thank you!"

## Future Enhancements

- **Multi-Model Support**: Integration with ResNet and EfficientNet models
- **ONNX/TensorRT Export**: Production-ready model optimization
- **WebSocket Updates**: Real-time model updates
- **Advanced Analytics**: Detection performance dashboards
- **Mobile App**: Native mobile application
- **Edge Computing**: On-device inference capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.