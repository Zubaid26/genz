"""
Local HTTP wrapper around FASHN VTON v1.5 for the Gen-Z Threads virtual try-on feature.

SETUP (one-time):
    git clone https://github.com/fashn-AI/fashn-vton-1.5
    cd fashn-vton-1.5
    python -m venv .venv
    .\\.venv\\Scripts\\Activate.ps1
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
    (use cu128 for RTX 50-series GPUs; cu124 is fine for older Ampere/Ada cards)
    pip install -e .
    pip install fastapi uvicorn python-multipart pillow
    python scripts/download_weights.py --weights-dir ./weights
    copy this file into the fashn-vton-1.5 folder as tryon_server.py

RUN (each time, before using the "Your Photo (AI)" try-on page):
    .venv\\Scripts\\python.exe -m uvicorn tryon_server:app --port 2100

This runs inside fashn-vton-1.5's own virtual environment (it needs its own
PyTorch build, separate from the conda env used by server/eCommerce API's
main.py). main.py calls this over HTTP (see fashn_client.py) instead of
importing it directly, since the two processes use incompatible dependency
versions.
"""

import io
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image

from fashn_vton import TryOnPipeline

WEIGHTS_DIR = str(Path(__file__).parent / "weights")

print("Loading FASHN VTON v1.5 pipeline...")
pipeline = TryOnPipeline(weights_dir=WEIGHTS_DIR)
print("FASHN VTON pipeline ready.")

app = FastAPI(title="FASHN VTON local service")


@app.get("/api/health")
def health():
    return {"status": "healthy", "model_loaded": True}


@app.post("/api/tryon")
async def tryon(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    category: str = Form("tops"),
    garment_photo_type: str = Form("model"),
    num_timesteps: int = Form(30),
    seed: int = Form(42),
):
    if category not in ("tops", "bottoms", "one-pieces"):
        category = "tops"
    if garment_photo_type not in ("model", "flat-lay"):
        garment_photo_type = "model"

    try:
        person = Image.open(io.BytesIO(await person_image.read())).convert("RGB")
        garment = Image.open(io.BytesIO(await garment_image.read())).convert("RGB")

        result = pipeline(
            person_image=person,
            garment_image=garment,
            category=category,
            garment_photo_type=garment_photo_type,
            num_samples=1,
            num_timesteps=num_timesteps,
            seed=seed,
        )

        buf = io.BytesIO()
        result.images[0].save(buf, format="JPEG", quality=92)
        return Response(buf.getvalue(), media_type="image/jpeg")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2100)
