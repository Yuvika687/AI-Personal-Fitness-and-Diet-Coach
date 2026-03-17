
import google.generativeai as genai

genai.configure(api_key="AIzaSyBKRIPygbu1s7Mlf7s-jdyihYK8moUlx_w")


model = genai.GenerativeModel("models/gemini-flash-latest")

response = model.generate_content(
    "You are a fitness AI coach. Say: Gemini is finally working."
)

print(response.text)
