import asyncio
import httpx
import json
import os

from dotenv import load_dotenv

load_dotenv()

async def main():
    groq_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "llama3-70b-8192")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": groq_model,
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant. Output JSON."},
                        {"role": "user", "content": "Analyze Ashwagandha and Metformin"}
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"}
                }
            )
            print("Status:", resp.status_code)
            print("Body:", resp.text)
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    asyncio.run(main())
