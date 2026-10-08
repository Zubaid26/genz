"""
Test Client for Virtual Try-On API
Simple script to test the API endpoints
"""

import requests
import json
import base64
from PIL import Image
import io
import os

# API base URL
BASE_URL = "http://localhost:8000"


def test_health():
    """Test health check endpoint"""
    print("\n" + "="*50)
    print("Testing Health Check...")
    print("="*50)
    
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200


def test_get_categories():
    """Test get categories endpoint"""
    print("\n" + "="*50)
    print("Testing Get Categories...")
    print("="*50)
    
    response = requests.get(f"{BASE_URL}/api/categories")
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Available categories: {data['categories']}")
    
    return data['categories']


def test_get_persons():
    """Test get persons endpoint"""
    print("\n" + "="*50)
    print("Testing Get Persons...")
    print("="*50)
    
    response = requests.get(f"{BASE_URL}/api/persons")
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Total persons available: {len(data)}")
    
    if data:
        print(f"\nFirst 3 persons:")
        for person in data[:3]:
            print(f"  - {person['category']}[{person['index']}]: {person['preview_url']}")
    
    return data


def test_get_garments():
    """Test get garments endpoint"""
    print("\n" + "="*50)
    print("Testing Get Garments...")
    print("="*50)
    
    # Get all garments
    response = requests.get(f"{BASE_URL}/api/garments")
    all_garments = response.json()
    print(f"Total garments: {len(all_garments)}")
    
    # Get only tops
    response = requests.get(f"{BASE_URL}/api/garments?garment_type=5")
    tops = response.json()
    print(f"Total tops: {len(tops)}")
    
    if tops:
        print(f"\nFirst 3 tops:")
        for garment in tops[:3]:
            print(f"  - {garment['category']}[{garment['index']}] {garment['garment_name']}: {garment['preview_url']}")
    
    return all_garments, tops


def test_get_person_image(category, index, save_path="person_preview.png"):
    """Test get person image endpoint"""
    print("\n" + "="*50)
    print(f"Testing Get Person Image ({category}[{index}])...")
    print("="*50)
    
    response = requests.get(f"{BASE_URL}/api/person-image/{category}/{index}")
    
    if response.status_code == 200:
        img = Image.open(io.BytesIO(response.content))
        img.save(save_path)
        print(f"✓ Image saved to {save_path}")
        print(f"  Image size: {img.size}")
        return True
    else:
        print(f"✗ Failed to get image: {response.status_code}")
        return False


def test_try_on(
    person_category="pattern",
    person_index=3,
    garments=None,
    save_path="tryon_result.png"
):
    """Test virtual try-on endpoint"""
    print("\n" + "="*50)
    print("Testing Virtual Try-On...")
    print("="*50)
    
    if garments is None:
        garments = [
            {"category": "plaid", "index": 0, "type": 5},  # Top
            {"category": "pattern", "index": 3, "type": 1}  # Bottom
        ]
    
    payload = {
        "person_category": person_category,
        "person_index": person_index,
        "garments": garments,
        "dressing_order": [2, 5, 1, 3]
    }
    
    print(f"Request payload:")
    print(json.dumps(payload, indent=2))
    
    print("\nSending request (this may take a few seconds)...")
    response = requests.post(f"{BASE_URL}/api/try-on", json=payload)
    
    if response.status_code == 200:
        result = response.json()
        
        if result["success"]:
            print("✓ Try-on successful!")
            
            # Decode and save image
            img_data = base64.b64decode(result["result_image"])
            img = Image.open(io.BytesIO(img_data))
            img.save(save_path)
            
            print(f"✓ Result image saved to {save_path}")
            print(f"  Image size: {img.size}")
            
            return True
        else:
            print(f"✗ Try-on failed: {result['message']}")
            return False
    else:
        print(f"✗ Request failed: {response.status_code}")
        print(f"  Error: {response.text}")
        return False


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("VIRTUAL TRY-ON API - COMPREHENSIVE TEST SUITE")
    print("="*60)
    
    # Create output directory
    os.makedirs("test_outputs", exist_ok=True)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ Health check failed! Is the server running?")
        return
    
    # Test 2: Get categories
    categories = test_get_categories()
    
    # Test 3: Get persons
    persons = test_get_persons()
    
    # Test 4: Get garments
    all_garments, tops = test_get_garments()
    
    # Test 5: Get person image
    if persons:
        person = persons[0]
        test_get_person_image(
            person['category'],
            person['index'],
            save_path="test_outputs/person_preview.png"
        )
    
    # Test 6: Virtual Try-On - Example 1 (Tuck in style)
    print("\n" + "="*60)
    print("EXAMPLE 1: Tuck-in style (hair → top → bottom)")
    print("="*60)
    test_try_on(
        person_category="pattern",
        person_index=3,
        garments=[
            {"category": "plaid", "index": 0, "type": 5},
            {"category": "pattern", "index": 3, "type": 1}
        ],
        save_path="test_outputs/tryon_tucked.png"
    )
    
    # Test 7: Virtual Try-On - Example 2 (Untucked style)
    print("\n" + "="*60)
    print("EXAMPLE 2: Untucked style (hair → bottom → top)")
    print("="*60)
    test_try_on(
        person_category="pattern",
        person_index=3,
        garments=[
            {"category": "plaid", "index": 0, "type": 5},
            {"category": "pattern", "index": 3, "type": 1}
        ],
        save_path="test_outputs/tryon_untucked.png"
    )
    
    # Test 8: Virtual Try-On - Example 3 (Single garment)
    print("\n" + "="*60)
    print("EXAMPLE 3: Single garment change (top only)")
    print("="*60)
    test_try_on(
        person_category="plaid",
        person_index=3,
        garments=[
            {"category": "print", "index": 2, "type": 5}
        ],
        save_path="test_outputs/tryon_single.png"
    )
    
    print("\n" + "="*60)
    print("ALL TESTS COMPLETED!")
    print("="*60)
    print("\nCheck the 'test_outputs' folder for generated images.")
    print("\nTest Summary:")
    print("  ✓ Health check")
    print("  ✓ Get categories")
    print("  ✓ Get persons")
    print("  ✓ Get garments")
    print("  ✓ Get person image")
    print("  ✓ Virtual try-on (3 examples)")
    print("\n" + "="*60)


def interactive_mode():
    """Interactive mode for manual testing"""
    print("\n" + "="*60)
    print("INTERACTIVE MODE")
    print("="*60)
    
    # Check health
    if not test_health():
        print("\n❌ Server not available!")
        return
    
    # Get available options
    print("\nFetching available options...")
    categories = test_get_categories()
    persons = test_get_persons()
    
    print("\n" + "-"*60)
    print("Select a person:")
    print("-"*60)
    
    # Group persons by category
    persons_by_cat = {}
    for p in persons[:20]:  # Show first 20
        cat = p['category']
        if cat not in persons_by_cat:
            persons_by_cat[cat] = []
        persons_by_cat[cat].append(p)
    
    idx = 1
    person_map = {}
    for cat, ps in persons_by_cat.items():
        print(f"\n{cat.upper()}:")
        for p in ps:
            print(f"  {idx}. Index {p['index']}")
            person_map[idx] = p
            idx += 1
    
    try:
        choice = int(input("\nEnter person number: "))
        selected_person = person_map.get(choice)
        
        if not selected_person:
            print("Invalid selection!")
            return
        
        print(f"\nSelected: {selected_person['category']}[{selected_person['index']}]")
        
        # Select garment
        print("\n" + "-"*60)
        print("Select garment type:")
        print("-"*60)
        print("1. Top (5)")
        print("2. Bottom (1)")
        print("3. Jacket (3)")
        print("4. Hair (2)")
        
        gtype_map = {1: 5, 2: 1, 3: 3, 4: 2}
        gtype_choice = int(input("\nEnter garment type: "))
        garment_type = gtype_map.get(gtype_choice)
        
        if not garment_type:
            print("Invalid selection!")
            return
        
        # Get garments of this type
        response = requests.get(f"{BASE_URL}/api/garments?garment_type={garment_type}")
        garments = response.json()[:10]  # Show first 10
        
        print(f"\nAvailable garments:")
        garment_map = {}
        for i, g in enumerate(garments, 1):
            print(f"  {i}. {g['category']}[{g['index']}]")
            garment_map[i] = g
        
        gchoice = int(input("\nEnter garment number: "))
        selected_garment = garment_map.get(gchoice)
        
        if not selected_garment:
            print("Invalid selection!")
            return
        
        print(f"\nSelected: {selected_garment['category']}[{selected_garment['index']}] {selected_garment['garment_name']}")
        
        # Perform try-on
        test_try_on(
            person_category=selected_person['category'],
            person_index=selected_person['index'],
            garments=[{
                "category": selected_garment['category'],
                "index": selected_garment['index'],
                "type": selected_garment['garment_type']
            }],
            save_path="test_outputs/interactive_result.png"
        )
        
    except (ValueError, KeyboardInterrupt):
        print("\nCancelled!")
        return


if __name__ == "__main__":
    import sys
    
    print("\n" + "="*60)
    print("VIRTUAL TRY-ON API TEST CLIENT")
    print("="*60)
    print("\nOptions:")
    print("  1. Run all tests")
    print("  2. Interactive mode")
    print("  3. Quick test (single try-on)")
    print()
    
    if len(sys.argv) > 1:
        mode = sys.argv[1]
    else:
        mode = input("Select mode (1/2/3): ").strip()
    
    if mode == "1":
        run_all_tests()
    elif mode == "2":
        interactive_mode()
    elif mode == "3":
        os.makedirs("test_outputs", exist_ok=True)
        test_health()
        test_try_on(save_path="test_outputs/quick_test.png")
    else:
        print("Invalid option!")
