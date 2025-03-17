from enum import Enum

scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]


class ListsNames(Enum):
    SEMANTIC_CORE = "semantic_core"
    TYPES_PAGES = "types_pages"
    STRUCTURE_DATA = "structure_data"
    COMMENTS = "comments"
