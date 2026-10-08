# #!/bin/bash

# # Virtual Try-On API Setup Script
# # This script sets up the entire environment from scratch

# set -e  # Exit on error

# echo "=========================================="
# echo "Virtual Try-On API Setup"
# echo "=========================================="
# echo ""

# # Check if Python 3 is installed
# if ! command -v python3 &> /dev/null; then
#     echo "Error: Python 3 is not installed. Please install Python 3.8 or higher."
#     exit 1
# fi

# echo "Python version:"
# python3 --version
# echo ""

# # Step 1: Create virtual environment
# echo "Step 1: Creating virtual environment..."
# if [ ! -d "venv" ]; then
#     python3 -m venv venv
#     echo "✓ Virtual environment created"
# else
#     echo "✓ Virtual environment already exists"
# fi
# echo ""

# # Step 2: Activate virtual environment
# echo "Step 2: Activating virtual environment..."
# source venv/bin/activate
# echo "✓ Virtual environment activated"
# echo ""

# # Step 3: Upgrade pip
# echo "Step 3: Upgrading pip..."
# pip install --upgrade pip
# echo "✓ pip upgraded"
# echo ""

# # Step 4: Install PyTorch (CPU or GPU version)
# echo "Step 4: Installing PyTorch..."
# echo "Choose PyTorch version:"
# echo "1) CPU only (smaller, works on all machines)"
# echo "2) GPU with CUDA 11.8 (requires NVIDIA GPU)"
# read -p "Enter choice (1 or 2): " pytorch_choice

# if [ "$pytorch_choice" = "2" ]; then
#     echo "Installing PyTorch with CUDA support..."
#     pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cu118
# else
#     echo "Installing PyTorch CPU version..."
#     pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cpu
# fi
# echo "✓ PyTorch installed"
# echo ""

# # Step 5: Install other requirements
# echo "Step 5: Installing other dependencies..."
# pip install fastapi==0.104.1 uvicorn[standard]==0.24.0 python-multipart==0.0.6
# pip install Pillow==10.1.0 numpy==1.24.3
# pip install scikit-image==0.21.0 scipy==1.11.4
# pip install tensorboardX==2.6.2.2 pandas==2.1.3
# pip install opencv-python==4.8.1.78 matplotlib==3.8.2
# pip install pydantic==2.5.0 aiofiles==23.2.1
# echo "✓ Dependencies installed"
# echo ""

# Step 6: Clone the dressing-in-order repository
echo "Step 6: Cloning dressing-in-order repository..."
if [ ! -d "dressing-in-order" ]; then
    git clone https://github.com/cuiaiyu/dressing-in-order
    echo "✓ Repository cloned"
else
    echo "✓ Repository already exists"
fi
echo ""

# Step 7: Fix the pose_utils.py file
echo "Step 7: Fixing pose_utils.py for scikit-image compatibility..."
POSE_UTILS_FILE="dressing-in-order/utils/pose_utils.py"

if [ -f "$POSE_UTILS_FILE" ]; then
    # Create backup
    cp "$POSE_UTILS_FILE" "$POSE_UTILS_FILE.backup"
    
    # Fix the disk() function calls
    sed -i 's/disk((int(joint\[1\]), int(joint\[0\])), radius=int(radius)/disk((int(joint[1]), int(joint[0])), int(radius)/g' "$POSE_UTILS_FILE"
    sed -i 's/disk((int(joint\[1\]), int(joint\[0\])), radius=int(point_radius)/disk((int(joint[1]), int(joint[0])), int(point_radius)/g' "$POSE_UTILS_FILE"
    
    echo "✓ pose_utils.py fixed"
else
    echo "⚠ Warning: pose_utils.py not found, you may need to fix it manually"
fi
echo ""

# Step 8: Download model checkpoint
echo "Step 8: Downloading model checkpoint..."
if [ ! -d "dressing-in-order/checkpoints" ]; then
    mkdir -p dressing-in-order/checkpoints
fi

if [ ! -d "dressing-in-order/checkpoints/DIORv1_64" ]; then
    echo "Downloading checkpoint from Google Drive..."
    pip install gdown
    cd dressing-in-order/checkpoints
    gdown 1MyHq-P0c8zz7ey7p_HTTZKeMie5ZuNlb
    unzip DIORv1_64.zip
    rm DIORv1_64.zip
    cd ../..
    echo "✓ Checkpoint downloaded"
else
    echo "✓ Checkpoint already exists"
fi
echo ""

# Step 9: Download test data
echo "Step 9: Downloading test data..."
if [ ! -d "dressing-in-order/data" ]; then
    mkdir -p dressing-in-order/data
    cd dressing-in-order/data
    
    echo "Downloading test data from Google Drive..."
    gdown 1toeQwAe57LNPTy9EWGG0u1XfTI7qv6b1  # testM_lip
    unzip testM_lip.zip
    rm testM_lip.zip
    
    gdown 1U2PljA7NE57jcSSzPs21ZurdIPXdYZtN  # images
    unzip images.zip
    rm images.zip
    
    gdown 12fZKGf0kIu5OX3mjC-C3tptxrD8sxm7x  # fasion-pairs-test.csv
    gdown 1MxkVFFtNsWFshQp_TA7qwIGEUEUIpYdS  # fasion-annotation-test.csv
    gdown 19nJSHrQuoJZ-6cSl3WEYlhQv6ZsAYG-X  # standard_test_anns.txt
    
    # Filter and rename images
    echo "Processing images..."
    mkdir -p test
    
    cd ../..
    echo "✓ Data downloaded"
else
    echo "✓ Data already exists"
fi
echo ""

# Step 10: Create data processing script
echo "Step 10: Creating data processing script..."
cat > process_data.py << 'EOF'
import os
from tqdm import tqdm

data_dir = 'dressing-in-order/data'
test_dir = os.path.join(data_dir, 'test')

if not os.path.exists(test_dir):
    os.makedirs(test_dir)

target_fns = [fn[:-4] for fn in os.listdir(os.path.join(data_dir, 'testM_lip'))]

for fn in tqdm(os.listdir(os.path.join(data_dir, 'images'))):
    elements = fn.split("-")
    elements[2] = elements[2].replace("_", "")
    last_elements = elements[-1].split("_")
    elements[-1] = last_elements[0] + "_" + last_elements[1] + last_elements[2]
    new_fn = "fashion" + "".join(elements)
    
    if new_fn[:-4] in target_fns:
        src = os.path.join(data_dir, 'images', fn)
        dst = os.path.join(test_dir, new_fn)
        if os.path.exists(src) and not os.path.exists(dst):
            os.rename(src, dst)

print("Data processing complete!")
EOF

python3 process_data.py
echo "✓ Data processed"
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "To start the API server:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run the server: python main.py"
echo "  3. Access Swagger UI at: http://localhost:8000/docs"
echo ""
echo "Or use the quick start script: ./start_server.sh"
echo "=========================================="
