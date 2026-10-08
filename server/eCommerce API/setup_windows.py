import os
import subprocess
import sys
import shutil
import zipfile

def run_command(command):
    print(f"Running: {command}")
    subprocess.check_call(command, shell=True)

def main():
    print("==========================================")
    print("Virtual Try-On API Setup (Windows)")
    print("==========================================")

    # 1. Install Requirements
    print("\nStep 1: Installing dependencies...")
    # Install gdown first to ensure it's available for later steps
    run_command(f"{sys.executable} -m pip install gdown")
    run_command(f"{sys.executable} -m pip install -r requirements.txt")

    # 2. Clone Repo
    print("\nStep 2: Checking for dressing-in-order repository...")
    if not os.path.exists("dressing-in-order"):
        print("Cloning dressing-in-order...")
        run_command("git clone https://github.com/cuiaiyu/dressing-in-order")
    else:
        print("dressing-in-order already exists.")

    # 3. Patch pose_utils.py
    print("\nStep 3: Patching pose_utils.py...")
    utils_path = os.path.join("dressing-in-order", "utils", "pose_utils.py")
    if os.path.exists(utils_path):
        with open(utils_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Apply corrections for scikit-image compatibility
        # Replaces faulty calls that use 'radius=' keyword where it might not be supported or is redundant in context
        new_content = content.replace("disk((int(joint[1]), int(joint[0])), radius=int(radius)", "disk((int(joint[1]), int(joint[0])), int(radius)")
        new_content = new_content.replace("disk((int(joint[1]), int(joint[0])), radius=int(point_radius)", "disk((int(joint[1]), int(joint[0])), int(point_radius)")
        
        if content != new_content:
            with open(utils_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print("✓ Patched pose_utils.py successfully.")
        else:
            print("✓ pose_utils.py already patched or no changes needed.")
    else:
        print("⚠ Warning: pose_utils.py not found. If this is a fresh clone, something might be wrong.")

    # 4. Download Checkpoint
    print("\nStep 4: Checking Model Checkpoints...")
    ckpt_dir = os.path.join("dressing-in-order", "checkpoints")
    os.makedirs(ckpt_dir, exist_ok=True)
    
    dior_dir = os.path.join(ckpt_dir, "DIORv1_64")
    if not os.path.exists(dior_dir) or not os.listdir(dior_dir):
        print("Downloading DIORv1_64 Checkpoint...")
        import gdown
        output_zip = os.path.join(ckpt_dir, "DIORv1_64.zip")
        
        # Only download if zip doesn't exist
        if not os.path.exists(output_zip):
            # 1MyHq-P0c8zz7ey7p_HTTZKeMie5ZuNlb is the ID from setup.sh
            gdown.download(id="1MyHq-P0c8zz7ey7p_HTTZKeMie5ZuNlb", output=output_zip, quiet=False)
        
        print("Extracting Checkpoint...")
        try:
            with zipfile.ZipFile(output_zip, 'r') as zip_ref:
                zip_ref.extractall(ckpt_dir)
            print("✓ Checkpoint extracted.")
            
            # Clean up zip
            os.remove(output_zip)
        except zipfile.BadZipFile:
            print("⚠ Error: Downloaded checkpoint zip appears corrupted. Please delete it and try again.")
    else:
        print("✓ Checkpoint DIORv1_64 already exists.")

    # 5. Run Data Setup
    print("\nStep 5: Running Data Setup (setup_data.py)...")
    if os.path.exists("setup_data.py"):
        run_command(f"{sys.executable} setup_data.py")
    else:
        print("⚠ Error: setup_data.py not found!")

    print("\n==========================================")
    print("Setup Complete!")
    print("==========================================")
    print("To start the server, run:")
    print(f"python main.py")

if __name__ == "__main__":
    main()
