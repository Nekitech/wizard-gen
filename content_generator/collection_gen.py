import json
import os
import sys

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from content_generator.helpers import result_to_json
from content_generator.llm_module import send_to_gemini

from dotenv import load_dotenv

load_dotenv(".env")
example_collection = """
        const newsCollection = defineCollection({
            type: "content",
            schema: z.object({
                news: z.array({
                    z.object({
                        title: z.string().describe('Название новости'),
                        date: z.string().describe('Дата публикации'),
                        text: z.string().describe('Текст новости'),
                        category: z.string().describe('Категория'),
                    }),
                }),
            })
        });
"""


def generate_collection(params):
    data = json.loads(params)
    template = f"""
        Cгенерируй коллекцию для astro для .md файла {data["type"]}, на основе данного объекта: 
        {data["list_fields"]}
        В ответе должно содержаться только объявление коллекции, без импорта библиотек или экспорта коллекции. У всех полей должны
        быть вызваны по итогу методы .describe() для описания предназначения поля. Не должно быть лишних и дополнительных комментариев.
        Поле schema должно быть объявлено в виде z.object(
            data["type"]: z.array({...})
        ), где ... - это объект с полями, которые соответствуют полям из list_fields. Как в примере должно быть
        Ответ вернуть в виде json, где в поле collection будет содержаться сама коллекция в виде строки, по примеру:
        {example_collection}
        
        Соотв, все названия заменяются согласно переданным данным. Также должно присутствовать присваивание 
        в соотв. названую переменную - collection: const {data["type"]}Collection = defineCollection(...)
    """
    result = send_to_gemini(template)
    print(result)
    return json.dumps(result_to_json(result))
