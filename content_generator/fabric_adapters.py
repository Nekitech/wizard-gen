from abc import ABC, abstractmethod
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_gigachat import GigaChat
from langchain_openai import ChatOpenAI

class LLMAdapter(ABC):
    @abstractmethod
    def send_prompt(self, prompt: str) -> str:
        pass

class GeminiAdapter(LLMAdapter):
    def __init__(self, credentials: str, model: str = "gemini-2.0-flash"):
        self.model = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=credentials,
            temperature=0.1,
            max_output_tokens=2048
        )

    def send_prompt(self, prompt: str) -> str:
        try:
            response = self.model.invoke(prompt)
            return response.content
        except Exception as e:
            print(f"Gemini error: {e}")
            return ""

class GigaChatAdapter(LLMAdapter):
    def __init__(self, credentials: str, model: str = "GigaChat"):
        self.model = GigaChat(
            credentials=credentials,
            model=model,
            verify_ssl_certs=False,
            temperature=0.1,
            profanity_check=False
        )

    def send_prompt(self, prompt: str) -> str:
        try:
            response = self.model.invoke(prompt)
            return response.content
        except Exception as e:
            print(f"GigaChat error: {e}")
            return ""

class OpenaiAdapter(LLMAdapter):
    def __init__(self, model: str = "gpt-4-turbo"):
        self.model = ChatOpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            model=model
        )
    
    def send_prompt(self, prompt: str) -> str:
        return self.model.invoke(prompt).content

class LLMAdapterFactory:
    @staticmethod
    def create_adapter(provider: str, credentials = "str", model: str|None = None) -> LLMAdapter:       
        adapters = {
            "GEMINI": GeminiAdapter,
            "GIGACHAT": GigaChatAdapter,
            "OPENAI": OpenaiAdapter
        }
        
        if provider not in adapters:
            raise ValueError(f"Unsupported LLM provider: {provider}")
        
        return adapters[provider](credentials, model) if model else adapters[provider](credentials)