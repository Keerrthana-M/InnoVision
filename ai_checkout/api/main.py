from fastapi import FastAPI, Form, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Minimal config (ML disabled during reset)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://<YOUR_PROJECT>.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "<SERVICE_ROLE_KEY>")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

# Keep Supabase client for non-ML operations (no-op here)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

class DetectResponse(BaseModel):
    status: str
    message: str | None = None

@app.post("/detect-vision", response_model=DetectResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def detect_vision_placeholder():
    return DetectResponse(status="disabled", message="/detect-vision is temporarily disabled during ML reset.")

@app.post("/train-new-item", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def train_new_item_placeholder():
    return {"status": "disabled", "message": "Training endpoint disabled during ML reset."}

@app.get("/get-products")
async def get_products():
    return {"status": "success", "products": []}

@app.post("/update-feedback", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def update_feedback_placeholder():
    return {"status": "disabled", "message": "Feedback endpoint disabled during ML reset."}

@app.post("/train-model", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def train_model_placeholder():
    return {"status": "disabled", "message": "Model training disabled during ML reset."}

@app.post("/detect-item", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def detect_item_placeholder():
    return {"status": "disabled", "message": "Item detection disabled during ML reset."}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
