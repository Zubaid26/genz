# Production Deployment Guide

## Overview

This guide covers deploying the Virtual Try-On API to production environments.

---

## Pre-Deployment Checklist

- [ ] Test all endpoints locally
- [ ] Run security audit
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Plan scaling strategy
- [ ] Set up CI/CD pipeline
- [ ] Configure logging
- [ ] Set up SSL/TLS
- [ ] Implement authentication
- [ ] Set rate limiting

---

## Deployment Options

### Option 1: Docker + Cloud (Recommended)

**Advantages:**
- Consistent environment
- Easy scaling
- Quick deployment
- Portable

**Steps:**

```bash
# 1. Build Docker image
docker build -t virtual-tryon-api:latest .

# 2. Tag for registry
docker tag virtual-tryon-api:latest your-registry/virtual-tryon-api:latest

# 3. Push to registry
docker push your-registry/virtual-tryon-api:latest

# 4. Deploy to cloud
# (AWS ECS, Google Cloud Run, Azure Container Instances, etc.)
```

### Option 2: Virtual Machine

**Steps:**

```bash
# 1. SSH into VM
ssh user@your-server.com

# 2. Clone repository
git clone <repo-url>
cd virtual-tryon-api

# 3. Run setup
./setup.sh

# 4. Install process manager
sudo apt install supervisor

# 5. Configure supervisor
sudo nano /etc/supervisor/conf.d/tryon-api.conf
```

**Supervisor Configuration:**
```ini
[program:tryon-api]
directory=/home/user/virtual-tryon-api
command=/home/user/virtual-tryon-api/venv/bin/python main.py
user=user
autostart=true
autorestart=true
stderr_logfile=/var/log/tryon-api.err.log
stdout_logfile=/var/log/tryon-api.out.log
environment=PYTHONUNBUFFERED=1
```

### Option 3: Kubernetes

**Deployment YAML:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: virtual-tryon-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: virtual-tryon-api
  template:
    metadata:
      labels:
        app: virtual-tryon-api
    spec:
      containers:
      - name: api
        image: your-registry/virtual-tryon-api:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
        env:
        - name: WORKERS
          value: "4"
---
apiVersion: v1
kind: Service
metadata:
  name: virtual-tryon-service
spec:
  selector:
    app: virtual-tryon-api
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

---

## Security Configuration

### 1. Add API Key Authentication

**Update main.py:**

```python
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

API_KEY = "your-secure-api-key"  # Use environment variable in production
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key

# Add to endpoints
@app.post("/api/try-on", dependencies=[Depends(verify_api_key)])
async def virtual_try_on(request: TryOnRequest):
    # ... existing code
```

### 2. Enable HTTPS

**Using nginx:**

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Rate Limiting

**Using slowapi:**

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/try-on")
@limiter.limit("10/minute")
async def virtual_try_on(request: Request, payload: TryOnRequest):
    # ... existing code
```

---

## Performance Optimization

### 1. Enable Caching

**Using Redis:**

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

@app.get("/api/persons")
async def get_available_persons():
    # Check cache
    cached = redis_client.get("persons_list")
    if cached:
        return json.loads(cached)
    
    # Fetch from source
    persons = model_handler.get_available_persons()
    
    # Cache for 1 hour
    redis_client.setex("persons_list", 3600, json.dumps(persons))
    
    return persons
```

### 2. Asynchronous Processing

**Using Celery:**

```python
from celery import Celery

celery_app = Celery('tasks', broker='redis://localhost:6379/0')

@celery_app.task
def async_try_on(payload):
    # Perform try-on in background
    result = model_handler.try_on(**payload)
    return result

@app.post("/api/try-on-async")
async def virtual_try_on_async(request: TryOnRequest):
    task = async_try_on.delay(request.dict())
    return {"task_id": task.id, "status": "processing"}

@app.get("/api/result/{task_id}")
async def get_result(task_id: str):
    task = async_try_on.AsyncResult(task_id)
    if task.ready():
        return {"status": "complete", "result": task.result}
    return {"status": "processing"}
```

### 3. GPU Optimization

**Multi-GPU Support:**

```python
import torch

# In model_handler.py
class DressingInOrderHandler:
    def __init__(self, gpu_id=0):
        self.device = torch.device(f'cuda:{gpu_id}' if torch.cuda.is_available() else 'cpu')
        # ... rest of init

# In main.py - Load balancing
gpu_handlers = [
    DressingInOrderHandler(gpu_id=0),
    DressingInOrderHandler(gpu_id=1),
]
current_gpu = 0

@app.post("/api/try-on")
async def virtual_try_on(request: TryOnRequest):
    global current_gpu
    handler = gpu_handlers[current_gpu]
    current_gpu = (current_gpu + 1) % len(gpu_handlers)
    
    result = handler.try_on(**request.dict())
    return result
```

---

## Monitoring & Logging

### 1. Add Prometheus Metrics

```python
from prometheus_client import Counter, Histogram, make_asgi_app

# Metrics
request_count = Counter('api_requests_total', 'Total API requests')
request_duration = Histogram('api_request_duration_seconds', 'Request duration')

@app.middleware("http")
async def metrics_middleware(request, call_next):
    request_count.inc()
    with request_duration.time():
        response = await call_next(request)
    return response

# Mount metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

### 2. Structured Logging

```python
import logging
from pythonjsonlogger import jsonlogger

logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

@app.post("/api/try-on")
async def virtual_try_on(request: TryOnRequest):
    logger.info("try_on_request", extra={
        "person": f"{request.person_category}[{request.person_index}]",
        "garments_count": len(request.garments)
    })
    # ... existing code
```

### 3. Error Tracking (Sentry)

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    sentry_sdk.capture_exception(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

---

## Database Integration (Optional)

For storing try-on history:

```python
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class TryOnHistory(Base):
    __tablename__ = "tryon_history"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    person_category = Column(String)
    person_index = Column(Integer)
    garments = Column(String)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    result_url = Column(String)

engine = create_engine('postgresql://user:pass@localhost/db')
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)

@app.post("/api/try-on")
async def virtual_try_on(request: TryOnRequest, user_id: str):
    # Perform try-on
    result = model_handler.try_on(**request.dict())
    
    # Save to database
    db = SessionLocal()
    history = TryOnHistory(
        user_id=user_id,
        person_category=request.person_category,
        person_index=request.person_index,
        garments=json.dumps([g.dict() for g in request.garments]),
        result_url=f"/results/{uuid.uuid4()}.png"
    )
    db.add(history)
    db.commit()
    db.close()
    
    return result
```

---

## Scaling Strategy

### Horizontal Scaling

```bash
# Load balancer (nginx)
upstream api_servers {
    server 10.0.0.1:8000;
    server 10.0.0.2:8000;
    server 10.0.0.3:8000;
}

server {
    location / {
        proxy_pass http://api_servers;
    }
}
```

### Auto-scaling (AWS)

```yaml
# Auto Scaling Group configuration
LaunchTemplate:
  ImageId: ami-xxxxx
  InstanceType: g4dn.xlarge  # GPU instance
  UserData: |
    #!/bin/bash
    cd /opt/virtual-tryon-api
    ./start_server.sh

AutoScalingGroup:
  MinSize: 2
  MaxSize: 10
  TargetCPUUtilization: 70%
```

---

## Backup & Disaster Recovery

### Model Checkpoints

```bash
# Backup script
#!/bin/bash
aws s3 sync ./dressing-in-order/checkpoints \
  s3://your-bucket/backups/checkpoints-$(date +%Y%m%d)
```

### Database Backups

```bash
# PostgreSQL backup
pg_dump dbname > backup_$(date +%Y%m%d).sql
aws s3 cp backup_*.sql s3://your-bucket/db-backups/
```

---

## Health Checks

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 5
```

### Uptime Monitoring

Use services like:
- Uptime Robot
- Pingdom
- StatusCake

---

## Cost Optimization

### 1. Spot Instances (AWS)

```python
# Use spot instances for non-critical workloads
# 70% cost savings
```

### 2. Caching Strategy

```
Level 1: In-memory (LRU cache)
Level 2: Redis (frequent requests)
Level 3: CDN (static images)
```

### 3. Request Batching

```python
# Batch multiple try-on requests
batch_queue = []

async def batch_processor():
    while True:
        if len(batch_queue) >= 10:
            # Process batch together for efficiency
            results = model_handler.batch_try_on(batch_queue)
            batch_queue.clear()
        await asyncio.sleep(0.1)
```

---

## Maintenance

### Regular Updates

```bash
# Update dependencies
pip install --upgrade -r requirements.txt

# Update model
wget new-model-checkpoint.zip
# Test before deploying

# Rolling update
kubectl rollout restart deployment/virtual-tryon-api
```

### Log Rotation

```bash
# /etc/logrotate.d/tryon-api
/var/log/tryon-api.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 640 www-data www-data
}
```

---

## Emergency Procedures

### API Down

1. Check health endpoint
2. Review logs
3. Restart service
4. Scale up if needed
5. Investigate root cause

### High Load

1. Enable rate limiting
2. Scale horizontally
3. Enable caching
4. Move to async processing

### Data Loss

1. Restore from latest backup
2. Verify data integrity
3. Update documentation
4. Review backup strategy

---

## Post-Deployment

- [ ] Monitor error rates
- [ ] Check response times
- [ ] Review logs
- [ ] Test all endpoints
- [ ] Update documentation
- [ ] Notify stakeholders
- [ ] Schedule review meeting

---

This completes the production deployment guide!
