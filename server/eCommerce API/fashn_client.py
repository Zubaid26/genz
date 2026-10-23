"""
Client for the local FASHN VTON v1.5 service (fashn-vton-1.5/tryon_server.py).

Replaces idm_vton_client.py: FASHN VTON runs fully on this machine's own GPU
(Apache-2.0, no Hugging Face / ngrok dependency, no non-commercial license
restriction), instead of proxying to a hosted Space.
"""

import os
import requests

FASHN_SERVICE_URL = os.environ.get("FASHN_SERVICE_URL", "http://localhost:2100")


def map_category(raw_category: str) -> str:
    """Map our product catalogue categories to FASHN's tops/bottoms/one-pieces."""
    c = (raw_category or "").lower()
    if any(k in c for k in ("jean", "pant", "trouser", "bottom")):
        return "bottoms"
    if any(k in c for k in ("dress", "gown", "jumpsuit", "one-piece", "onepiece")):
        return "one-pieces"
    return "tops"


def run_try_on(person_image_path, garment_image_path, garment_category=None, seed=42, num_timesteps=30):
    """
    Calls the local FASHN VTON service. Returns the raw JPEG bytes of the result.
    """
    category = map_category(garment_category)
    with open(person_image_path, "rb") as pf, open(garment_image_path, "rb") as gf:
        files = {
            "person_image": ("person.jpg", pf, "image/jpeg"),
            "garment_image": ("garment.jpg", gf, "image/jpeg"),
        }
        data = {
            "category": category,
            "garment_photo_type": "model",
            "num_timesteps": num_timesteps,
            "seed": seed,
        }
        response = requests.post(f"{FASHN_SERVICE_URL}/api/tryon", files=files, data=data, timeout=180)
        response.raise_for_status()
        return response.content
