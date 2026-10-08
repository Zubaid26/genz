# API Documentation - Virtual Try-On API v1.0

## Base URL
```
http://localhost:8000
```

## Authentication
Currently, the API does not require authentication. For production use, implement API keys or OAuth2.

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/api/health` | Health check |
| GET | `/api/persons` | List all persons |
| GET | `/api/garments` | List all garments |
| GET | `/api/person-image/{category}/{index}` | Get person preview |
| GET | `/api/garment-image/{category}/{index}/{type}` | Get garment preview |
| POST | `/api/try-on` | Perform virtual try-on |
| GET | `/api/garment-types` | List garment types |
| GET | `/api/categories` | List categories |

---

## Detailed Endpoint Documentation

### 1. Root Endpoint

**GET** `/`

Returns basic API information.

**Response:**
```json
{
  "message": "Virtual Try-On API",
  "version": "1.0.0",
  "endpoints": {
    "docs": "/docs",
    "persons": "/api/persons",
    "garments": "/api/garments",
    "try-on": "/api/try-on"
  }
}
```

---

### 2. Health Check

**GET** `/api/health`

Check if the API is running and model is loaded.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

**Status Codes:**
- `200 OK` - Service is healthy
- `503 Service Unavailable` - Model not loaded

---

### 3. List Persons

**GET** `/api/persons`

Get a list of all available person models.

**Response:**
```json
[
  {
    "category": "pattern",
    "index": 0,
    "preview_url": "/api/person-image/pattern/0"
  },
  {
    "category": "plaid",
    "index": 0,
    "preview_url": "/api/person-image/plaid/0"
  }
]
```

**Response Fields:**
- `category` (string): The category/group of the person
- `index` (integer): Index within the category
- `preview_url` (string): URL to get preview image

---

### 4. List Garments

**GET** `/api/garments`

Get a list of all available garments.

**Query Parameters:**
- `garment_type` (integer, optional): Filter by type
  - `1` - Bottom (pants, skirts)
  - `2` - Hair
  - `3` - Jacket (outerwear)
  - `5` - Top (shirts, dresses)

**Example Request:**
```bash
GET /api/garments?garment_type=5
```

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

---

### 5. Get Person Image

**GET** `/api/person-image/{category}/{index}`

Get preview image of a specific person.

**Path Parameters:**
- `category` (string): Person category
- `index` (integer): Person index

**Example Request:**
```bash
GET /api/person-image/pattern/3
```

**Response:**
- Content-Type: `image/png`
- Returns PNG image file

**Status Codes:**
- `200 OK` - Image returned
- `404 Not Found` - Person not found
- `500 Internal Server Error` - Error generating image

---

### 6. Get Garment Image

**GET** `/api/garment-image/{category}/{index}/{garment_type}`

Get preview image of a specific garment.

**Path Parameters:**
- `category` (string): Garment category
- `index` (integer): Garment index
- `garment_type` (integer): Type of garment (1, 2, 3, or 5)

**Example Request:**
```bash
GET /api/garment-image/plaid/0/5
```

**Response:**
- Content-Type: `image/png`
- Returns PNG image file

---

### 7. Virtual Try-On

**POST** `/api/try-on`

Perform virtual try-on operation.

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
  "dressing_order": [2, 5, 1, 3],
  "pose_transfer": null
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `person_category` | string | Yes | Category of the person |
| `person_index` | integer | Yes | Index of the person |
| `garments` | array | Yes | List of garments to apply |
| `garments[].category` | string | Yes | Garment category |
| `garments[].index` | integer | Yes | Garment index |
| `garments[].type` | integer | Yes | Garment type (1,2,3,5) |
| `dressing_order` | array | No | Order of layering (default: [2,5,1,3]) |
| `pose_transfer` | object | No | Pose transfer settings |

**Dressing Order:**
- `[2, 5, 1, 3]` - Hair, Top, Bottom, Jacket (tucked in)
- `[2, 1, 5, 3]` - Hair, Bottom, Top, Jacket (untucked)

**Response:**
```json
{
  "success": true,
  "message": "Try-on successful",
  "result_image": "base64_encoded_image_data...",
  "image_url": "/api/result/latest"
}
```

**Response Fields:**
- `success` (boolean): Whether operation succeeded
- `message` (string): Status message
- `result_image` (string): Base64 encoded PNG image
- `image_url` (string): URL to access result

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "result_image": null,
  "image_url": null
}
```

**Example - Decode Result Image:**
```python
import base64
from PIL import Image
import io

# From response
result_image_b64 = response.json()["result_image"]

# Decode
img_data = base64.b64decode(result_image_b64)
img = Image.open(io.BytesIO(img_data))

# Save or display
img.save("result.png")
img.show()
```

---

### 8. List Garment Types

**GET** `/api/garment-types`

Get information about available garment types.

**Response:**
```json
{
  "garment_types": {
    "1": "bottom",
    "2": "hair",
    "3": "jacket",
    "5": "top (dress is also considered as top)"
  }
}
```

---

### 9. List Categories

**GET** `/api/categories`

Get list of all available categories.

**Response:**
```json
{
  "categories": [
    "pattern",
    "plaid",
    "print",
    "stripe",
    "solid"
  ]
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "detail": "Error message description"
}
```

**Common HTTP Status Codes:**

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Model not loaded |

---

## Rate Limiting

Currently no rate limiting is implemented. For production:

**Recommended Limits:**
- 10 requests/minute for try-on endpoint
- 100 requests/minute for listing endpoints
- No limit for static image serving

---

## Best Practices

### 1. Cache Responses
Cache person and garment lists to reduce API calls:

```python
import functools

@functools.lru_cache(maxsize=1)
def get_persons():
    return requests.get(f"{API_URL}/api/persons").json()
```

### 2. Batch Processing
Process multiple try-ons asynchronously:

```python
import asyncio
import aiohttp

async def try_on_async(session, payload):
    async with session.post(f"{API_URL}/api/try-on", json=payload) as resp:
        return await resp.json()

async def batch_try_on(payloads):
    async with aiohttp.ClientSession() as session:
        tasks = [try_on_async(session, p) for p in payloads]
        return await asyncio.gather(*tasks)
```

### 3. Error Handling
Always handle errors gracefully:

```python
try:
    response = requests.post(f"{API_URL}/api/try-on", json=payload, timeout=30)
    response.raise_for_status()
    result = response.json()
    
    if not result.get("success"):
        print(f"Try-on failed: {result['message']}")
except requests.Timeout:
    print("Request timed out")
except requests.RequestException as e:
    print(f"Request error: {e}")
```

### 4. Image Optimization
Optimize result images before storage:

```python
from PIL import Image
import io

# Decode image
img_data = base64.b64decode(result["result_image"])
img = Image.open(io.BytesIO(img_data))

# Resize if needed
if img.size[0] > 1024:
    img.thumbnail((1024, 1024))

# Compress
img.save("result.jpg", "JPEG", quality=85, optimize=True)
```

---

## Integration Examples

### E-commerce Product Page

```javascript
// Frontend JavaScript
async function tryOnGarment(personId, garmentId) {
    const response = await fetch('http://localhost:8000/api/try-on', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            person_category: personId.category,
            person_index: personId.index,
            garments: [{
                category: garmentId.category,
                index: garmentId.index,
                type: garmentId.type
            }]
        })
    });
    
    const result = await response.json();
    
    if (result.success) {
        // Display image
        document.getElementById('result-image').src = 
            'data:image/png;base64,' + result.result_image;
    }
}
```

### Mobile App (React Native)

```javascript
import React, { useState } from 'react';
import { Image, Button } from 'react-native';

function VirtualTryOn() {
    const [resultImage, setResultImage] = useState(null);
    
    const tryOn = async () => {
        const response = await fetch('http://localhost:8000/api/try-on', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                person_category: 'pattern',
                person_index: 3,
                garments: [{ category: 'plaid', index: 0, type: 5 }]
            })
        });
        
        const result = await response.json();
        if (result.success) {
            setResultImage('data:image/png;base64,' + result.result_image);
        }
    };
    
    return (
        <>
            <Button title="Try On" onPress={tryOn} />
            {resultImage && <Image source={{ uri: resultImage }} />}
        </>
    );
}
```

---

## Performance Benchmarks

**Typical Response Times** (on CPU):

| Endpoint | Average Time |
|----------|--------------|
| `/api/health` | <10ms |
| `/api/persons` | ~50ms |
| `/api/garments` | ~100ms |
| `/api/person-image/{...}` | ~200ms |
| `/api/try-on` | ~10-15s |

**With GPU**: Try-on reduces to ~2-3s

---

## Version History

### v1.0.0 (Current)
- Initial release
- Basic virtual try-on functionality
- Support for 4 garment types
- REST API with FastAPI
- Swagger documentation

---

## Support & Feedback

For API issues or feature requests, please open an issue on GitHub.

**API Monitoring:**
- Health check: `GET /api/health`
- Model status: Check `model_loaded` field

**Logs:**
- Server logs: Check console output
- Error details: Available in response messages
