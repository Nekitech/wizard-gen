import json
import os
import time
import requests


def send_to_llm(prompt):
    llm = os.getenv("LLM_PROVIDER")
    model = os.getenv("MODEL")
    
    if llm == "GEMINI":
        if model:
            return send_to_gemini(prompt, model)
        else:
            return send_to_gemini(prompt)

    if llm == "GIGACHAT":
        if model:
            return send_to_gigachat(prompt, model)
        else:
            return send_to_gigachat(prompt)


def send_to_gemini(prompt, model="gemini-2.0-flash"):
    time.sleep(7)
    google_api_key = os.getenv("API")
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
    

def send_to_gigachat(prompt, model="gigachat"):
    from gigachat import GigaChat
    api = os.getenv("API")
    try:
        with GigaChat(credentials=api, model=model, verify_ssl_certs=False) as giga:
            response = giga.chat(prompt)
            print(response.choices[0].message.content)
            return response.choices[0].message.content
    except Exception as e:
        print(f"Ошибка при отправке запроса в GigaChat: {e}")
        return None

