# AI Checkout API

This is the backend API for the seamless checkout application.

## Features

- Barcode scanning endpoint
- Image recognition endpoint (with YOLO integration)
- Supabase integration for data storage
- Real-time cart updates

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## Endpoints

### POST /detect-item

Detect an item from either a barcode or an image.

**Barcode detection:**
```bash
curl -X POST "http://localhost:8000/detect-item" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "barcode=8901037XXXXXX"
```

**Image recognition:**
```bash
curl -X POST "http://localhost:8000/detect-item" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@path/to/image.jpg"
```

### GET /health

Health check endpoint.

```bash
curl -X GET "http://localhost:8000/health"
```