# Virtual Try-On API

A FastAPI-based REST API for virtual try-on using the Dressing-in-Order (DIOR) deep learning model. This API allows users to virtually try on different clothing items on fashion models.

## 🌟 Features

- **Virtual Try-On**: Swap clothes on models with different garments
- **Pose Transfer**: Transfer poses between different models
- **Multiple Garment Types**: Support for tops, bottoms, jackets, and hair
- **Easy Integration**: RESTful API with automatic documentation
- **Fast Processing**: GPU acceleration support for faster inference

## 📋 Requirements

- Python 3.8 or higher
- 4GB+ RAM
- (Optional) NVIDIA GPU with CUDA for faster processing
- Linux/MacOS (Windows users: use WSL or Docker)

## 🚀 Quick Start

### 1. Clone this repository

```bash
git clone <your-repo-url>
cd virtual-tryon-api
```

### 2. Run the setup script

```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Create a virtual environment
- Install all dependencies
- Download the dressing-in-order model
- Download test data
- Fix compatibility issues

**Note**: The setup may take 15-30 minutes depending on your internet speed.

### 3. Start the server

```bash
chmod +x start_server.sh
./start_server.sh
```

The server will start on `http://localhost:8000`

### 4. Access the API documentation

Open your browser and go to:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📖 API Endpoints

### Health Check
```
GET /api/health
```
Check if the API is running and model is loaded.

### Get Available Persons
```
GET /api/persons
```
Returns a list of all available person models.

**Response:**
```json
[
  {
    "category": "pattern",
    "index": 0,
    "preview_url": "/api/person-image/pattern/0"
  }
]
```

### Get Available Garments
```
GET /api/garments?garment_type=5
```
Returns a list of available garments. Optional filter by `garment_type`:
- `1`: Bottom
- `2`: Hair
- `3`: Jacket
- `5`: Top/Dress

**Response:**
```json
[
  {
    "category": "plaid",
    "index": 0,
    "garment_type": 5,
    "garment_name": "top",
    "preview_url": "/api/garment-image/plaid/0/5"
  }
]
```

### Get Person Image
```
GET /api/person-image/{category}/{index}
```
Returns the preview image of a specific person.

### Get Garment Image
```
GET /api/garment-image/{category}/{index}/{garment_type}
```
Returns the preview image of a specific garment.

### Virtual Try-On
```
POST /api/try-on
```

Perform virtual try-on with specified garments.

**Request Body:**
```json
{
  "person_category": "pattern",
  "person_index": 3,
  "garments": [
    {
      "category": "plaid",
      "index": 0,
      "type": 5
    },
    {
      "category": "pattern",
      "index": 3,
      "type": 1
    }
  ],
  "dressing_order": [2, 5, 1, 3]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Try-on successful",
  "result_image": "base64_encoded_image_string",
  "image_url": "/api/result/latest"
}
```

### Get Garment Types
```
GET /api/garment-types
```
Returns information about available garment types.

### Get Categories
```
GET /api/categories
```
Returns list of all available categories.

## 🎨 Usage Examples

### Example 1: Simple Try-On

Try on a plaid top and pattern bottom on a person:

```python
import requests
import json
from PIL import Image
import base64
import io

# API endpoint
url = "http://localhost:8000/api/try-on"

# Request payload
payload = {
    "person_category": "pattern",
    "person_index": 3,
    "garments": [
        {"category": "plaid", "index": 0, "type": 5},  # Top
        {"category": "pattern", "index": 3, "type": 1}  # Bottom
    ],
    "dressing_order": [2, 5, 1, 3]  # hair, top, bottom, jacket
}

# Make request
response = requests.post(url, json=payload)
result = response.json()

if result["success"]:
    # Decode base64 image
    img_data = base64.b64decode(result["result_image"])
    img = Image.open(io.BytesIO(img_data))
    img.show()
    # Or save
    img.save("result.png")
else:
    print(f"Error: {result['message']}")
```

### Example 2: Using curl

```bash
curl -X POST "http://localhost:8000/api/try-on" \
  -H "Content-Type: application/json" \
  -d '{
    "person_category": "pattern",
    "person_index": 3,
    "garments": [
      {"category": "plaid", "index": 0, "type": 5}
    ]
  }'
```

### Example 3: Get Available Options

```python
import requests

# Get all persons
persons = requests.get("http://localhost:8000/api/persons").json()
print(f"Available persons: {len(persons)}")

# Get all tops
tops = requests.get("http://localhost:8000/api/garments?garment_type=5").json()
print(f"Available tops: {len(tops)}")

# Get categories
categories = requests.get("http://localhost:8000/api/categories").json()
print(f"Categories: {categories['categories']}")
```

## 🔧 Configuration

### Garment Types

The API supports the following garment types:

| Type | Name | Description |
|------|------|-------------|
| 1 | Bottom | Pants, skirts, etc. |
| 2 | Hair | Hairstyles |
| 3 | Jacket | Outerwear |
| 5 | Top | Shirts, dresses, etc. |

### Dressing Order

The `dressing_order` parameter controls the layering of garments:

```python
[2, 5, 1, 3]  # Default: hair → top → bottom → jacket
[2, 1, 5, 3]  # Alternative: hair → bottom → top → jacket (untucked)
```

## 🐛 Troubleshooting

### Issue: Model not loading

**Solution**: Ensure the checkpoint was downloaded correctly:
```bash
ls -la dressing-in-order/checkpoints/DIORv1_64/
```

### Issue: Data not found

**Solution**: Re-run the data download:
```bash
cd dressing-in-order/data
# Follow the download steps in setup.sh
```

### Issue: CUDA out of memory

**Solution**: Use CPU mode by setting `gpu_ids = []` in `model_handler.py`

### Issue: Port 8000 already in use

**Solution**: Change the port in `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8080)  # Use different port
```

## 📦 Project Structure

```
virtual-tryon-api/
├── main.py                 # FastAPI application
├── model_handler.py        # Model loading and inference
├── requirements.txt        # Python dependencies
├── setup.sh               # Setup script
├── start_server.sh        # Server start script
├── README.md              # This file
├── dressing-in-order/     # Model repository
│   ├── checkpoints/       # Model weights
│   ├── data/             # Test dataset
│   ├── models/           # Model architecture
│   └── utils/            # Utility functions
└── venv/                  # Virtual environment
```

## 🎯 Performance

- **CPU**: ~10-15 seconds per image
- **GPU (CUDA)**: ~2-3 seconds per image

## 📝 Citation

If you use this API in your research, please cite the original Dressing-in-Order paper:

```bibtex
@article{cui2021dressing,
  title={Dressing in order: Recurrent person image generation for pose transfer, virtual try-on and outfit editing},
  author={Cui, Aiyu and McKee, Daniel and Lazebnik, Svetlana},
  journal={arXiv preprint arXiv:2104.07021},
  year={2021}
}
```

## 📄 License

This project is for research and educational purposes. Please refer to the original [Dressing-in-Order](https://github.com/cuiaiyu/dressing-in-order) repository for licensing information.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check the [troubleshooting](#-troubleshooting) section

## 🔄 Updates

### Version 1.0.0 (Current)
- Initial release
- Basic virtual try-on functionality
- REST API with FastAPI
- Support for multiple garment types
- Swagger documentation

---

Made with ❤️ for virtual fashion experiences
