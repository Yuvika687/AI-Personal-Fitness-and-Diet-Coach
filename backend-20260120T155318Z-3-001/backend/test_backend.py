# test_backend.py
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("Testing backend endpoints...")
    
    # Test root endpoint
    response = requests.get(f"{BASE_URL}/")
    print(f"GET /: {response.status_code} - {response.json()}")
    
    # Test health endpoint
    response = requests.get(f"{BASE_URL}/health")
    print(f"GET /health: {response.status_code} - {response.json()}")
    
    # Test register endpoint
    print("\nTesting register endpoint...")
    register_data = {
        "email": "test2@example.com",
        "password": "test123",
        "full_name": "Test User"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"POST /auth/register: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_endpoints()