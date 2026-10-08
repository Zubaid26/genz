#!/bin/bash

# Quick start script for the Virtual Try-On API

echo "Starting Virtual Try-On API..."
echo ""

# # Activate virtual environment
# if [ -d "venv" ]; then
#     source venv/bin/activate
#     echo "✓ Virtual environment activated"
# else
#     echo "Error: Virtual environment not found. Run setup.sh first."
#     exit 1
# fi

# Check if model checkpoint exists
if [ ! -d "dressing-in-order/checkpoints/DIORv1_64" ]; then
    echo "Error: Model checkpoint not found. Run setup.sh first."
    exit 1
fi

# Check if data exists
if [ ! -d "dressing-in-order/data" ]; then
    echo "Error: Data not found. Run setup.sh first."
    exit 1
fi

echo ""
echo "=========================================="
echo "Starting server on http://localhost:8000"
echo "Swagger UI: http://localhost:8000/docs"
echo "=========================================="
echo ""

# Start the server
python main.py
