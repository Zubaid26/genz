"""
Data Setup and Verification Script
This script downloads and sets up all required data files
"""

import os
import sys
import subprocess
from pathlib import Path

def check_gdown():
    """Check if gdown is installed"""
    try:
        import gdown
        print("✓ gdown is installed")
        return True
    except ImportError:
        print("✗ gdown not installed")
        print("Installing gdown...")
        subprocess.run([sys.executable, "-m", "pip", "install", "gdown"])
        return True

def setup_data_directory():
    """Setup data directory structure"""
    data_dir = Path("./dressing-in-order/data")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    test_dir = data_dir / "test"
    test_dir.mkdir(exist_ok=True)
    
    print(f"✓ Data directory created: {data_dir}")
    return data_dir

def download_file(file_id, output_name, output_dir):
    """Download a file from Google Drive"""
    import gdown
    
    output_path = output_dir / output_name
    
    # Check if file already exists and is valid
    if output_path.exists() and output_path.stat().st_size > 0:
        print(f"✓ {output_name} already exists")
        return True
    
    print(f"Downloading {output_name}...")
    url = f"https://drive.google.com/uc?id={file_id}"
    
    try:
        gdown.download(url, str(output_path), quiet=False)
        print(f"✓ Downloaded {output_name}")
        return True
    except Exception as e:
        print(f"✗ Failed to download {output_name}: {e}")
        return False

def extract_zip(zip_path, extract_dir):
    """Extract a zip file"""
    import zipfile
    
    if not zip_path.exists():
        print(f"✗ {zip_path} not found")
        return False
    
    print(f"Extracting {zip_path.name}...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        print(f"✓ Extracted {zip_path.name}")
        
        # Remove zip file after extraction
        zip_path.unlink()
        print(f"✓ Removed {zip_path.name}")
        return True
    except Exception as e:
        print(f"✗ Failed to extract {zip_path.name}: {e}")
        return False

def process_images(data_dir):
    """Process and rename images"""
    from tqdm import tqdm
    
    images_dir = data_dir / "images"
    test_dir = data_dir / "test"
    testM_lip_dir = data_dir / "testM_lip"
    
    if not images_dir.exists():
        print("✗ images directory not found")
        return False
    
    if not testM_lip_dir.exists():
        print("✗ testM_lip directory not found")
        return False
    
    # Get target filenames
    target_fns = [fn[:-4] for fn in os.listdir(testM_lip_dir)]
    print(f"Found {len(target_fns)} target files")
    
    # Process images
    print("Processing images...")
    processed = 0
    
    for fn in tqdm(os.listdir(images_dir)):
        elements = fn.split("-")
        elements[2] = elements[2].replace("_", "")
        last_elements = elements[-1].split("_")
        elements[-1] = last_elements[0] + "_" + last_elements[1] + last_elements[2]
        new_fn = "fashion" + "".join(elements)
        
        if new_fn[:-4] in target_fns:
            src = images_dir / fn
            dst = test_dir / new_fn
            
            if src.exists() and not dst.exists():
                src.rename(dst)
                processed += 1
    
    print(f"✓ Processed {processed} images")
    return True

def verify_data(data_dir):
    """Verify all required data files exist"""
    print("\n" + "="*60)
    print("VERIFYING DATA FILES")
    print("="*60)
    
    required_files = [
        "fasion-pairs-test.csv",
        "fasion-annotation-test.csv",
        "standard_test_anns.txt"
    ]
    
    required_dirs = [
        "testM_lip",
        "test"
    ]
    
    all_ok = True
    
    # Check files
    for filename in required_files:
        filepath = data_dir / filename
        if filepath.exists():
            size = filepath.stat().st_size
            print(f"✓ {filename} ({size} bytes)")
        else:
            print(f"✗ {filename} MISSING")
            all_ok = False
    
    # Check directories
    for dirname in required_dirs:
        dirpath = data_dir / dirname
        if dirpath.exists():
            count = len(list(dirpath.iterdir()))
            print(f"✓ {dirname}/ ({count} files)")
        else:
            print(f"✗ {dirname}/ MISSING")
            all_ok = False
    
    return all_ok

def main():
    print("="*60)
    print("DRESSING-IN-ORDER DATA SETUP")
    print("="*60)
    print()
    
    # Step 1: Check dependencies
    print("Step 1: Checking dependencies...")
    check_gdown()
    print()
    
    # Step 2: Setup directories
    print("Step 2: Setting up directories...")
    data_dir = setup_data_directory()
    print()
    
    # Step 3: Download data files
    print("Step 3: Downloading data files...")
    
    downloads = [
        ("1toeQwAe57LNPTy9EWGG0u1XfTI7qv6b1", "testM_lip.zip", True),
        ("1U2PljA7NE57jcSSzPs21ZurdIPXdYZtN", "images.zip", True),
        ("12fZKGf0kIu5OX3mjC-C3tptxrD8sxm7x", "fasion-pairs-test.csv", False),
        ("1MxkVFFtNsWFshQp_TA7qwIGEUEUIpYdS", "fasion-annotation-test.csv", False),
        ("19nJSHrQuoJZ-6cSl3WEYlhQv6ZsAYG-X", "standard_test_anns.txt", False),
    ]
    
    for file_id, filename, is_zip in downloads:
        download_file(file_id, filename, data_dir)
        
        if is_zip:
            zip_path = data_dir / filename
            if zip_path.exists():
                extract_zip(zip_path, data_dir)
    
    print()
    
    # Step 4: Process images
    print("Step 4: Processing images...")
    process_images(data_dir)
    print()
    
    # Step 5: Verify everything
    if verify_data(data_dir):
        print("\n" + "="*60)
        print("✓ DATA SETUP COMPLETE!")
        print("="*60)
        print("\nYou can now run: python main.py")
    else:
        print("\n" + "="*60)
        print("⚠ DATA SETUP INCOMPLETE")
        print("="*60)
        print("\nSome files are missing. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
