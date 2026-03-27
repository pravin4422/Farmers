import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

def get_agriculture_advice(prompt: str):
    response = model.generate_content(
        f"""
        You are an expert Indian agricultural advisor.

        Provide:
        1. Most likely cause
        2. Step-by-step solution
        3. Prevention tips

        Farmer question: {prompt}
        """
    )
    
    return response.text