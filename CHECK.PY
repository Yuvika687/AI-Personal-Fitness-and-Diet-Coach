
from google import genai

# Initialize client
client = genai.Client(api_key="AIzaSyAl0F0-qINiDmrH28TeWYR5QQWkAXlgRzM")

# List available models to see what's accessible
print("Available models:")
models = client.models.list()
for model in models:
    print(f"- {model.name}")

# Test with a simple prompt
response = client.models.generate_content(
    model="gemini-1.5-flash-latest",  # Use this model name
    contents="Hello, how are you?"
)
print("\nResponse:", response.text)