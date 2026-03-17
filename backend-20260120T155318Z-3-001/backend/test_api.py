# backend/test_api.py
import requests
import json
import time



register_data = {
    "email": f"test_{int(time.time())}@example.com",
    "password": "Test@12345",
    "full_name": "API Test User"
}


BASE_URL = "http://localhost:8000"

def test_all_endpoints():
    print("🧪 Testing Backend API...")
    
    # Test 1: Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Server running: {response.status_code}")
    except:
        print("❌ Server not running on localhost:8000")
        return
    
    # Test 2: Register test user
    print("\n👤 Testing Registration...")
    

    register_data = {
        "email": f"test_{int(time.time())}@example.com",
        "password": "Test@12345",
        "full_name": "API Test User"
    }

    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Registration: {response.status_code}")
    try:
        print("Response:", response.json())
    except:
        print("Raw response:", response.text)
    if response.status_code == 200:
        user = response.json()
        print(f"User created: {user['email']}")
        
        # Test 3: Login
        print("\n🔐 Testing Login...")
        login_data = {
            "email": "test_api@example.com",
            "password": "test123"
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data['access_token']
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test 4: Diet Plan
            print("\n🍎 Testing Diet Plan...")
            response = requests.get(f"{BASE_URL}/diet/generate-plan", headers=headers)
            print(f"Diet Plan: {response.status_code}")
            if response.status_code == 200:
                print("✅ Diet plan works!")
            
            # Test 5: Nutrition Tips
            print("\n💡 Testing Nutrition Tips...")
            response = requests.get(f"{BASE_URL}/diet/quick-tips", headers=headers)
            print(f"Nutrition Tips: {response.status_code}")
            if response.status_code == 200:
                print("✅ Nutrition tips work!")
            
            # Test 6: BMI Calculation
            print("\n📊 Testing BMI...")
            response = requests.get(f"{BASE_URL}/diet/bmi", headers=headers)
            print(f"BMI: {response.status_code}")
            if response.status_code == 200:
                print("✅ BMI calculation works!")
            
            # Test 7: Chat
            print("\n🤖 Testing Chat...")
            chat_data = {"message": "Hello"}
            response = requests.post(f"{BASE_URL}/chat/ask", json=chat_data, headers=headers)
            print(f"Chat: {response.status_code}")
            if response.status_code == 200:
                print("✅ Chat works!")
            
            print("\n🎉 All tests completed!")
        else:
            print("❌ Login failed")
    else:
        print("❌ Registration failed")

if __name__ == "__main__":
    test_all_endpoints()