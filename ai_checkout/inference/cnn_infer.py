import os
import json
from pathlib import Path
from typing import Tuple, Optional
import numpy as np
from PIL import Image
import tensorflow as tf

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / 'models'
CLASS_INDEX_PATH = MODELS_DIR / 'class_indices.json'
MODEL_PATH = MODELS_DIR / 'bigbasket_vision_model.h5'

_model: Optional[tf.keras.Model] = None
_idx_to_class = None


def load_model() -> bool:
    global _model, _idx_to_class
    try:
        if not MODEL_PATH.exists() or not CLASS_INDEX_PATH.exists():
            print(f"CNN model or class indices not found. Looked for: {MODEL_PATH}, {CLASS_INDEX_PATH}")
            return False
        _model = tf.keras.models.load_model(str(MODEL_PATH))
        with open(CLASS_INDEX_PATH, 'r') as f:
            payload = json.load(f)
            _idx_to_class = {int(k): v for k, v in payload['idx_to_class'].items()}
        print("Loaded CNN model for BigBasket classification.")
        return True
    except Exception as e:
        print(f"Error loading CNN model: {e}")
        _model = None
        _idx_to_class = None
        return False


def preprocess_image(img_arr: np.ndarray, target_size=(224, 224)) -> np.ndarray:
    # img_arr is expected BGR (from OpenCV); convert to RGB
    img_rgb = Image.fromarray(img_arr[:, :, ::-1])
    img = img_rgb.resize(target_size)
    x = np.array(img).astype('float32') / 255.0
    x = np.expand_dims(x, axis=0)
    return x


def predict(img_arr: np.ndarray) -> Optional[Tuple[str, float]]:
    if _model is None or _idx_to_class is None:
        return None
    x = preprocess_image(img_arr)
    probs = _model.predict(x, verbose=0)[0]
    cls_idx = int(np.argmax(probs))
    conf = float(probs[cls_idx])
    label = _idx_to_class.get(cls_idx)
    return (label, conf)
