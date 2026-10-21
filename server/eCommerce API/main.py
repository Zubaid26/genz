"""
Virtual Try-On API using Dressing-in-Order Model
FastAPI application for e-commerce virtual try-on
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import io
import base64
import os
import json
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import numpy as np
import requests

from model_handler import DressingInOrderHandler
import idm_vton_client

_ai_tryon_executor = ThreadPoolExecutor(max_workers=2)

# Initialize FastAPI app
app = FastAPI(
    title="Virtual Try-On API",
    description="API for virtual try-on using Dressing-in-Order model",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model handler
model_handler = None

# Request/Response Models
class PersonInfo(BaseModel):
    """Information about available persons"""
    category: str
    index: int
    preview_url: str

class GarmentInfo(BaseModel):
    """Information about available garments"""
    category: str
    index: int
    garment_type: int  # 1=bottom, 2=hair, 3=jacket, 5=top
    garment_name: str
    preview_url: str

class TryOnRequest(BaseModel):
    """Request for virtual try-on"""
    person_category: str
    person_index: int
    garments: List[dict]  # [{"category": "plaid", "index": 0, "type": 5}, ...]
    dressing_order: Optional[List[int]] = [2, 5, 1, 3]  # Default: hair, top, bottom, jacket
    pose_transfer: Optional[dict] = None  # {"category": "pattern", "index": 2} for pose transfer

class TryOnResponse(BaseModel):
    """Response from virtual try-on"""
    success: bool
    message: str
    result_image: Optional[str] = None  # Base64 encoded image
    image_url: Optional[str] = None


class AITryOnRequest(BaseModel):
    """Request for AI virtual try-on (IDM-VTON): real person photo + real garment photo"""
    person_image: str  # Base64 encoded photo of the customer
    garment_image: Optional[str] = None      # Base64 encoded garment photo
    garment_image_url: Optional[str] = None  # OR a URL to a product photo
    garment_description: Optional[str] = ""
    denoise_steps: Optional[int] = 30
    seed: Optional[int] = 42


class AITryOnResponse(BaseModel):
    """Response from AI virtual try-on"""
    success: bool
    message: str
    result_image: Optional[str] = None  # Base64 encoded image


@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    global model_handler
    print("Loading Dressing-in-Order model...")
    model_handler = DressingInOrderHandler(
        dataroot='./dressing-in-order/data',
        checkpoint_path='./dressing-in-order/checkpoints/DIORv1_64'
    )
    print("Model loaded successfully!")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Virtual Try-On API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "persons": "/api/persons",
            "garments": "/api/garments",
            "try-on": "/api/try-on"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model_handler is not None
    }


@app.get("/api/persons", response_model=List[PersonInfo])
async def get_available_persons():
    """Get list of available persons from the dataset"""
    if model_handler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        persons = model_handler.get_available_persons()
        return persons
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting persons: {str(e)}")


@app.get("/api/garments", response_model=List[GarmentInfo])
async def get_available_garments(garment_type: Optional[int] = None):
    """
    Get list of available garments from the dataset
    
    Parameters:
    - garment_type: Filter by type (1=bottom, 2=hair, 3=jacket, 5=top)
    """
    if model_handler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        garments = model_handler.get_available_garments(garment_type)
        return garments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting garments: {str(e)}")


@app.get("/api/person-image/{category}/{index}")
async def get_person_image(category: str, index: int):
    """Get preview image of a person"""
    if model_handler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        image = model_handler.get_person_preview(category, index)
        
        # Convert tensor to PIL Image
        img_array = image.cpu().numpy()
        img_array = (img_array + 1) / 2  # Denormalize from [-1, 1] to [0, 1]
        img_array = np.transpose(img_array, (1, 2, 0))
        img_array = (img_array * 255).astype(np.uint8)
        
        pil_img = Image.fromarray(img_array)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        pil_img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return StreamingResponse(img_byte_arr, media_type="image/png")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting image: {str(e)}")


@app.get("/api/garment-image/{category}/{index}/{garment_type}")
async def get_garment_image(category: str, index: int, garment_type: int):
    """Get preview image of a garment"""
    if model_handler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        image = model_handler.get_garment_preview(category, index, garment_type)
        
        # Convert tensor to PIL Image
        img_array = image.cpu().numpy()
        img_array = (img_array + 1) / 2
        img_array = np.transpose(img_array, (1, 2, 0))
        img_array = (img_array * 255).astype(np.uint8)
        
        pil_img = Image.fromarray(img_array)
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        pil_img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        return StreamingResponse(img_byte_arr, media_type="image/png")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting garment: {str(e)}")


@app.post("/api/try-on", response_model=TryOnResponse)
async def virtual_try_on(request: TryOnRequest):
    """
    Perform virtual try-on
    
    Example request:
    {
        "person_category": "pattern",
        "person_index": 3,
        "garments": [
            {"category": "plaid", "index": 0, "type": 5},
            {"category": "pattern", "index": 3, "type": 1}
        ],
        "dressing_order": [2, 5, 1, 3]
    }
    """
    if model_handler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Perform try-on
        result_image = model_handler.try_on(
            person_category=request.person_category,
            person_index=request.person_index,
            garments=request.garments,
            dressing_order=request.dressing_order,
            pose_transfer=request.pose_transfer
        )
        
        # Convert result to base64
        img_array = result_image.cpu().numpy()
        img_array = (img_array + 1) / 2
        img_array = np.transpose(img_array, (1, 2, 0))
        img_array = (img_array * 255).astype(np.uint8)
        
        pil_img = Image.fromarray(img_array)
        
        # Convert to base64
        buffered = io.BytesIO()
        pil_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return TryOnResponse(
            success=True,
            message="Try-on successful",
            result_image=img_str,
            image_url="/api/result/latest"
        )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return TryOnResponse(
            success=False,
            message=f"Error during try-on: {str(e)}"
        )


@app.get("/api/garment-types")
async def get_garment_types():
    """Get available garment types"""
    return {
        "garment_types": {
            "1": "bottom",
            "2": "hair",
            "3": "jacket",
            "5": "top (dress is also considered as top)"
        }
    }


@app.get("/api/categories")
async def get_categories():
    """Get available person/garment categories"""
    if model_handler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        categories = model_handler.get_categories()
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting categories: {str(e)}")


def _save_base64_image(b64_data: str, suffix: str = ".png") -> str:
    """Decode a base64 (optionally data-URL prefixed) image to a temp file and return its path."""
    if "," in b64_data and b64_data.strip().startswith("data:"):
        b64_data = b64_data.split(",", 1)[1]
    raw = base64.b64decode(b64_data)
    path = os.path.join(tempfile.gettempdir(), f"tryon_{uuid.uuid4().hex}{suffix}")
    with open(path, "wb") as f:
        f.write(raw)
    return path


def _download_image(url: str, suffix: str = ".jpg") -> str:
    """Download a remote image (e.g. a product photo) to a temp file and return its path."""
    response = requests.get(url, timeout=20)
    response.raise_for_status()
    path = os.path.join(tempfile.gettempdir(), f"garment_{uuid.uuid4().hex}{suffix}")
    with open(path, "wb") as f:
        f.write(response.content)
    return path


@app.post("/api/ai-try-on", response_model=AITryOnResponse)
async def ai_virtual_try_on(request: AITryOnRequest):
    """
    Real AI virtual try-on using the IDM-VTON Hugging Face Space: the customer's
    own uploaded photo is combined with a garment photo (uploaded or a product
    image URL) through a diffusion model, instead of picking from the fixed
    Dressing-in-Order dataset of sample persons/garments.
    """
    if not request.person_image:
        return AITryOnResponse(success=False, message="A photo of yourself is required.")
    if not request.garment_image and not request.garment_image_url:
        return AITryOnResponse(success=False, message="A garment image is required.")

    person_path = None
    garment_path = None
    try:
        person_path = _save_base64_image(request.person_image)
        if request.garment_image:
            garment_path = _save_base64_image(request.garment_image)
        else:
            garment_path = _download_image(request.garment_image_url)

        loop = asyncio.get_event_loop()
        result_path = await asyncio.wait_for(
            loop.run_in_executor(
                _ai_tryon_executor,
                idm_vton_client.run_try_on,
                person_path,
                garment_path,
                request.garment_description,
                request.denoise_steps,
                request.seed,
            ),
            timeout=150,
        )

        with open(result_path, "rb") as f:
            img_str = base64.b64encode(f.read()).decode()

        return AITryOnResponse(success=True, message="AI try-on complete.", result_image=img_str)

    except asyncio.TimeoutError:
        return AITryOnResponse(
            success=False,
            message="The AI try-on service timed out. It runs on a shared free queue (Hugging Face "
                    "ZeroGPU) — please try again in a moment."
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return AITryOnResponse(success=False, message=f"AI try-on failed: {str(e)}")
    finally:
        for p in (person_path, garment_path):
            try:
                if p and os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2000)
