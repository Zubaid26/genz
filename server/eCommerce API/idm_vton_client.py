"""
Client wrapper for the public IDM-VTON Hugging Face Space.
Unlike Kwai-Kolors/Kolors-Virtual-Try-On (whose Gradio API is disabled and
proxies to a private backend), yisol/IDM-VTON exposes a real callable
endpoint (api_name="/tryon") that runs inference in its own process.
"""

import os
from gradio_client import Client, handle_file

IDM_VTON_SPACE = os.environ.get("IDM_VTON_SPACE", "yisol/IDM-VTON")

_client = None


def get_client():
    global _client
    if _client is None:
        _client = Client(IDM_VTON_SPACE)
    return _client


def run_try_on(person_image_path, garment_image_path, garment_description="", denoise_steps=30, seed=42):
    """
    Calls the IDM-VTON Space's /tryon endpoint.

    person_image_path: local path to a photo of the person
    garment_image_path: local path to a photo of the garment (flat lay or on a model)
    Returns a local file path to the generated try-on image.
    """
    client = get_client()
    result = client.predict(
        {"background": handle_file(person_image_path), "layers": [], "composite": None},
        handle_file(garment_image_path),
        garment_description or "",
        True,   # is_checked: use the Space's auto-generated body mask
        False,  # is_checked_crop: auto crop & resize the person photo
        denoise_steps,
        seed,
        api_name="/tryon",
    )
    # result = (try_on_image_path, masked_image_path)
    return result[0]
