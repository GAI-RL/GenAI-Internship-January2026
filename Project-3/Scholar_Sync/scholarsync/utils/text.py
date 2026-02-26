import re
from typing import Iterable


def normalize_title(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^a-z0-9 ]", "", text)
    return text


def dedupe_by_title(items: Iterable, title_getter):
    seen: set[str] = set()
    output = []
    for item in items:
        key = normalize_title(title_getter(item))
        if key in seen:
            continue
        seen.add(key)
        output.append(item)
    return output
