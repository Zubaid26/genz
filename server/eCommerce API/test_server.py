import urllib.request
import json
import time
import sys

def check_server():
    url = "http://localhost:8000/api/health"
    print(f"Checking server status at: {url}...")
    
    max_retries = 5
    for i in range(max_retries):
        try:
            with urllib.request.urlopen(url) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode())
                    print("\n✅ SERVER IS ONLINE AND WORKING!")
                    print(f"Response: {json.dumps(data, indent=2)}")
                    return True
        except urllib.error.URLError as e:
            print(f"Attempt {i+1}/{max_retries}: Server not reachable yet ({e.reason})...")
            time.sleep(2)
            
    print("\n❌ Server check timed out. make sure the server window is open and running!")
    return False

if __name__ == "__main__":
    check_server()
