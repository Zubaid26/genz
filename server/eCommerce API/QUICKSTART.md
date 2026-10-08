# Quick Start Guide - Virtual Try-On API

## 🚀 Installation & Setup (5 minutes)

### Method 1: Automatic Setup (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd virtual-tryon-api

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Start server
chmod +x start_server.sh
./start_server.sh
```

### Method 2: Docker (Alternative)

```bash
# Build and run with docker-compose
docker-compose up --build
```

## 📖 First API Call (2 minutes)

### Test 1: Health Check

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Test 2: Get Available Persons

```bash
curl http://localhost:8000/api/persons | jq '.[0:3]'
```

### Test 3: Virtual Try-On

```bash
curl -X POST "http://localhost:8000/api/try-on" \
  -H "Content-Type: application/json" \
  -d '{
    "person_category": "pattern",
    "person_index": 3,
    "garments": [
      {"category": "plaid", "index": 0, "type": 5}
    ]
  }' | jq '.success'
```

## 🎨 Using the Test Client

```bash
# Activate environment
source venv/bin/activate

# Run all tests
python test_client.py 1

# Interactive mode
python test_client.py 2

# Quick test
python test_client.py 3
```

## 📱 Access Swagger UI

Open in browser: **http://localhost:8000/docs**

### Try it in Swagger:

1. Click on `/api/try-on` endpoint
2. Click "Try it out"
3. Modify the request body:
```json
{
  "person_category": "pattern",
  "person_index": 3,
  "garments": [
    {
      "category": "plaid",
      "index": 0,
      "type": 5
    }
  ],
  "dressing_order": [2, 5, 1, 3]
}
```
4. Click "Execute"
5. See the result with base64 encoded image

## 🐍 Python Client Example

```python
import requests
import base64
from PIL import Image
import io

# Make try-on request
response = requests.post(
    "http://localhost:8000/api/try-on",
    json={
        "person_category": "pattern",
        "person_index": 3,
        "garments": [
            {"category": "plaid", "index": 0, "type": 5}
        ]
    }
)

result = response.json()

if result["success"]:
    # Decode and display image
    img_data = base64.b64decode(result["result_image"])
    img = Image.open(io.BytesIO(img_data))
    img.show()  # Or img.save("result.png")
```

## 🎯 Common Use Cases

### Use Case 1: Try Different Tops

```python
tops = requests.get("http://localhost:8000/api/garments?garment_type=5").json()

for top in tops[:5]:
    response = requests.post(
        "http://localhost:8000/api/try-on",
        json={
            "person_category": "pattern",
            "person_index": 0,
            "garments": [
                {
                    "category": top["category"],
                    "index": top["index"],
                    "type": 5
                }
            ]
        }
    )
    # Process result...
```

### Use Case 2: Complete Outfit

```python
response = requests.post(
    "http://localhost:8000/api/try-on",
    json={
        "person_category": "pattern",
        "person_index": 3,
        "garments": [
            {"category": "plaid", "index": 0, "type": 5},   # Top
            {"category": "pattern", "index": 2, "type": 1},  # Bottom
            {"category": "print", "index": 1, "type": 3}     # Jacket
        ],
        "dressing_order": [2, 5, 1, 3]  # hair, top, bottom, jacket
    }
)
```

### Use Case 3: Browse All Options

```python
# Get all categories
categories = requests.get("http://localhost:8000/api/categories").json()

# Get persons in each category
for cat in categories["categories"]:
    persons = requests.get(
        f"http://localhost:8000/api/persons"
    ).json()
    
    # Filter by category
    cat_persons = [p for p in persons if p["category"] == cat]
    print(f"{cat}: {len(cat_persons)} persons")
```

## 🔧 Troubleshooting Quick Fixes

### Server won't start
```bash
# Check if port is in use
lsof -i :8000

# Use different port
python main.py --port 8080  # Modify main.py first
```

### Model not loading
```bash
# Re-download checkpoint
cd dressing-in-order/checkpoints
rm -rf DIORv1_64
gdown 1MyHq-P0c8zz7ey7p_HTTZKeMie5ZuNlb
unzip DIORv1_64.zip
```

### Out of memory
```bash
# Use CPU mode (modify model_handler.py)
# Change: opt.gpu_ids = [0] if torch.cuda.is_available() else []
# To: opt.gpu_ids = []
```

## 📊 Performance Tips

### For Faster Processing:
- Use GPU if available
- Reduce batch processing
- Cache frequently used person/garment combinations

### For Production:
- Add Redis for caching
- Use async processing with Celery
- Deploy behind nginx reverse proxy
- Use Docker for consistent environment

## 🎓 Next Steps

1. ✅ Get API running
2. ✅ Test with Swagger UI
3. ✅ Run test client
4. 📚 Read full API documentation
5. 🔨 Integrate into your e-commerce app
6. 🚀 Deploy to production

## 📞 Need Help?

- Check the full README.md
- Review Swagger docs at /docs
- Run the test client for examples
- Check server logs for errors

---

**Total setup time: ~20 minutes**
**First successful API call: ~5 minutes**

Happy virtual try-on! 👗👔
