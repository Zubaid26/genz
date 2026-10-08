FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    unzip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install gdown for Google Drive downloads
RUN pip install gdown

# Copy application files
COPY main.py .
COPY model_handler.py .

# Clone dressing-in-order repository
RUN git clone https://github.com/cuiaiyu/dressing-in-order

# Fix pose_utils.py
RUN sed -i 's/disk((int(joint\[1\]), int(joint\[0\])), radius=int(radius)/disk((int(joint[1]), int(joint[0])), int(radius)/g' dressing-in-order/utils/pose_utils.py && \
    sed -i 's/disk((int(joint\[1\]), int(joint\[0\])), radius=int(point_radius)/disk((int(joint[1]), int(joint[0])), int(point_radius)/g' dressing-in-order/utils/pose_utils.py

# Download model checkpoint
RUN mkdir -p dressing-in-order/checkpoints && \
    cd dressing-in-order/checkpoints && \
    gdown 1MyHq-P0c8zz7ey7p_HTTZKeMie5ZuNlb && \
    unzip DIORv1_64.zip && \
    rm DIORv1_64.zip

# Download test data
RUN mkdir -p dressing-in-order/data && \
    cd dressing-in-order/data && \
    gdown 1toeQwAe57LNPTy9EWGG0u1XfTI7qv6b1 && \
    unzip testM_lip.zip && \
    rm testM_lip.zip && \
    gdown 1U2PljA7NE57jcSSzPs21ZurdIPXdYZtN && \
    unzip images.zip && \
    rm images.zip && \
    gdown 12fZKGf0kIu5OX3mjC-C3tptxrD8sxm7x && \
    gdown 1MxkVFFtNsWFshQp_TA7qwIGEUEUIpYdS && \
    gdown 19nJSHrQuoJZ-6cSl3WEYlhQv6ZsAYG-X

# Process data
RUN cd dressing-in-order/data && \
    mkdir -p test

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "main.py"]
