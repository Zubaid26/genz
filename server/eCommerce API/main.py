"""
Virtual Try-On API — proxies to the local FASHN VTON v1.5 service.
FastAPI application for e-commerce virtual try-on.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import base64
import os
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor
import requests

import fashn_client

_ai_tryon_executor = ThreadPoolExecutor(max_workers=2)

app = FastAPI(
    title="Virtual Try-On API",
    description="API for virtual try-on using FASHN VTON v1.5",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AITryOnRequest(BaseModel):
    """Request for AI virtual try-on (FASHN VTON v1.5): real person photo + real garment photo"""
    person_image: str  # Base64 encoded photo of the customer
    garment_image: Optional[str] = None      # Base64 encoded garment photo
    garment_image_url: Optional[str] = None  # OR a URL to a product photo
    garment_description: Optional[str] = ""
    garment_category: Optional[str] = ""     # Product category, mapped to tops/bottoms/one-pieces
    denoise_steps: Optional[int] = 30
    seed: Optional[int] = 42


class AITryOnResponse(BaseModel):
    """Response from AI virtual try-on"""
    success: bool
    message: str
    result_image: Optional[str] = None  # Base64 encoded image


@app.get("/")
async def root():
    return {
        "message": "Virtual Try-On API (FASHN VTON v1.5)",
        "version": "2.0.0",
        "endpoints": {"docs": "/docs", "health": "/api/health", "ai-try-on": "/api/ai-try-on"}
    }


@app.get("/api/health")
async def health_check():
    """Health check — reflects whether the local FASHN VTON sidecar is reachable."""
    try:
        resp = requests.get(f"{fashn_client.FASHN_SERVICE_URL}/api/health", timeout=5)
        resp.raise_for_status()
        return {"status": "healthy", "model_loaded": bool(resp.json().get("model_loaded"))}
    except Exception as e:
        return {"status": "unavailable", "model_loaded": False, "error": str(e)}


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
    Real AI virtual try-on using FASHN VTON v1.5, running locally on this
    machine's GPU: the customer's own photo is combined with a garment photo
    (uploaded or a product image URL) through a diffusion model.
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
        result_bytes = await asyncio.wait_for(
            loop.run_in_executor(
                _ai_tryon_executor,
                fashn_client.run_try_on,
                person_path,
                garment_path,
                request.garment_category or request.garment_description,
                request.seed,
                request.denoise_steps,
            ),
            timeout=150,
        )

        img_str = base64.b64encode(result_bytes).decode()

        return AITryOnResponse(success=True, message="AI try-on complete.", result_image=img_str)

    except asyncio.TimeoutError:
        return AITryOnResponse(
            success=False,
            message="The AI try-on service timed out. Make sure the local FASHN VTON service "
                    "(fashn-vton-1.5/tryon_server.py) is running."
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
