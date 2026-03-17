# setup.py
import os
import sys
from pathlib import Path

def setup_environment():
    print("🚀 Setting up AI Gym Pro...")
    
    # Create necessary directories
    directories = [
        'uploads',
        'logs',
        'frontend/chat',
        'frontend/vision',
        'backend/app/core',
        'backend/app/models',
        'backend/app/routes',
        'backend/app/schemas'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"📁 Created directory: {directory}")
    
    # Check for .env file
    if not Path('.env').exists():
        print("📝 Creating .env file...")
        env_content = '''DATABASE_URL=sqlite:///./ai_gym.db
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI APIs (Get your keys from respective platforms)
DEEPSEEK_API_KEY=your_deepseek_key_here
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=optional_openai_key_here

# Server
PORT=8000
HOST=0.0.0.0
DEBUG=true
'''
        with open('.env', 'w') as f:
            f.write(env_content)
        print("⚠️  Please update your API keys in the .env file")
    
    # Check requirements
    print("\n📦 Checking requirements...")
    os.system('pip install -r requirements.txt')
    
    # Create database
    print("\n🗄️  Creating database...")
    os.system('python create_tables.py')
    
    print("\n✅ Setup complete!")
    print("\n🎯 Next steps:")
    print("1. Update your API keys in .env file")
    print("2. Run: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("3. Open frontend/index.html in your browser")

if __name__ == "__main__":
    setup_environment()