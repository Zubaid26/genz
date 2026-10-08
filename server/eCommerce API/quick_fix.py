"""
Quick Fix Script for Windows
Fixes the data directory and downloads missing files
"""

import os
import sys
from pathlib import Path
import shutil

def main():
    print("="*60)
    print("QUICK FIX FOR WINDOWS")
    print("="*60)
    print()
    
    # Step 1: Clean up partial downloads
    print("Step 1: Cleaning up partial downloads...")
    data_dir = Path("./dressing-in-order/data")
    
    if data_dir.exists():
        # Remove .part files
        for part_file in data_dir.glob("*.part"):
            print(f"  Removing {part_file.name}")
            part_file.unlink()
        
        # Remove zipvs3 files
        for zip_file in data_dir.glob("*.zipvs3*"):
            print(f"  Removing {zip_file.name}")
            zip_file.unlink()
        
        print("✓ Cleanup complete")
    else:
        print("✓ Data directory doesn't exist yet")
    
    print()
    
    # Step 2: Run the data setup script
    print("Step 2: Running data setup...")
    print()
    
    # Import and run setup_data
    try:
        import setup_data
        result = setup_data.main()
        
        if result == 0:
            print()
            print("="*60)
            print("✓ FIX COMPLETE!")
            print("="*60)
            print()
            print("Now you can run:")
            print("  python main.py")
            print()
            print("Or:")
            print("  .\\start_server.sh")
        else:
            print()
            print("="*60)
            print("⚠ FIX INCOMPLETE")
            print("="*60)
            print()
            print("Please check the errors above and try again.")
            
    except Exception as e:
        print(f"Error running setup: {e}")
        print()
        print("Please run manually:")
        print("  python setup_data.py")
        return 1
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nFix cancelled by user")
        sys.exit(1)
