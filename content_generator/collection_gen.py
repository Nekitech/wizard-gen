import os
import json
import sys

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from content_generator.helpers import result_to_json
from content_generator.llm_module import send_to_gemini

from dotenv import load_dotenv


load_dotenv('.env')
example_collection = """
        const castAnimeCollection = defineCollection({
          type: "content",
          schema: z.object({
              slug: z.string().describe('поле slug, нужно для составления url-ов'),
              title: z.string(),
              fio: z.string(),
              isActor: z.boolean().optional(),
            }),
        });
        
        const quizCollection = defineCollection({
            type: "content",
            schema: ({image}) =>
                z.object({
                    title: z.string(),
                    description: z.string(),
                    image: image(),
                    questions: z.array(
                        z.object({
                            id: z.number(),
                            question: z.string(),
                            options: z.array(
                                z.object({
                                    text: z.string(),
                                    isCorrect: z.boolean(),
                                })
                            ),
                        })
                    ),
                }),
        });
"""

def generate_collection(params):
    data = json.loads(params)
    google_api_key = os.getenv("GEMINIAPI")
    template = f"""
        Cгенерируй коллекцию для astro для .md файла {data['typePage']}, на основе данного объекта: 
        {data}
        В ответе должно содержаться только объявление коллекции, без импорта библиотек или экспорта коллекции. У всех полей должны
        быть вызваны по итогу методы .describe() для описания предназначения поля. Не должно быть лишних и дополнительных комментариев.
        Ответ вернуть в виде json, где в поле collection будет содержаться сама коллекция в виде строки, по примеру:
        {example_collection}
        
        Соотв, все названия заменяются согласно переданным данным. Также должно присутствовать присваивание 
        в соотв. названую переменную - collection: const {data['typePage']}Collection = defineCollection(...)
    """
    result = send_to_gemini(template, google_api_key)
    print(result)
    return json.dumps(result_to_json(result))
