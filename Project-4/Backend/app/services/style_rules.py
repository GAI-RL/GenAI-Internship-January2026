import re
import random

CONNECTORS = [
    "Furthermore", "Moreover", "Additionally",
    "In conclusion", "Therefore", "Thus"
]

# Controlled synonym dictionary
SYNONYM_MAP = {
    "refers to": "means",
    "in order to": "to",
    "utilize": "use",
    "assistance": "help",
    "purchase": "buy",
    "demonstrate": "show",
    "approximately": "about",
    "individuals": "people",
    "numerous": "many",
    "require": "need",
    "obtain": "get",
    "commence": "start",
    "terminate": "end"
}


def remove_ai_connectors(text: str):
    for word in CONNECTORS:
        text = text.replace(word + ",", "")
        text = text.replace(word, "")
    return text


def vary_sentence_structure(text: str):
    sentences = re.split(r'(?<=[.!?]) +', text)

    if len(sentences) > 2:
        # randomly merge two short sentences
        for i in range(len(sentences)-1):
            if len(sentences[i].split()) < 8:
                sentences[i] = sentences[i] + " and " + sentences[i+1].lower()
                del sentences[i+1]
                break

    return " ".join(sentences)


def replace_with_synonyms(text: str):
    """
    Replace selected formal/AI-like words with simpler synonyms.
    Case-insensitive and preserves basic casing.
    """
    for phrase, synonym in SYNONYM_MAP.items():
        pattern = re.compile(rf"\b{re.escape(phrase)}\b", re.IGNORECASE)
        text = pattern.sub(synonym, text)
    return text


def inject_light_human_tone(text: str):
    if random.random() > 0.6:
        text = text.replace("is", "is actually", 1)
    return text