import json
import os

import requests


def send_to_gemini(prompt, model="gemini-2.0-flash"):
    google_api_key = os.getenv("GEMINIAPI")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={google_api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        result = response.json()

        if 'candidates' in result and result['candidates']:
            content = result['candidates'][0].get('content', [{}])
            parts = content.get('parts', [])
            if parts:
                return parts[0].get('text', '')
        return None
    except Exception as e:
        print(f"Ошибка при отправке запроса в Gemini: {e}")
        return None
