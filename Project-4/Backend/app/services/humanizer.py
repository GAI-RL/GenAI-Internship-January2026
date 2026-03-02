import re
import torch
import random
import spacy
from difflib import SequenceMatcher
from transformers import T5Tokenizer, T5ForConditionalGeneration, AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer, util

# --- Global Initialization ---
nlp = spacy.load("en_core_web_sm")
device = "cuda" if torch.cuda.is_available() else "cpu"

# T5 Paraphraser (The Brain)
T5_MODEL_NAME = "humarin/chatgpt_paraphraser_on_T5_base"
t5_tokenizer = T5Tokenizer.from_pretrained(T5_MODEL_NAME)
t5_model = T5ForConditionalGeneration.from_pretrained(T5_MODEL_NAME).to(device)
t5_model.eval()

# AI Detector (The Critic)
DETECTOR_MODEL_NAME = "Hello-SimpleAI/chatgpt-detector-roberta"
detector_tokenizer = AutoTokenizer.from_pretrained(DETECTOR_MODEL_NAME)
detector_model = AutoModelForSequenceClassification.from_pretrained(DETECTOR_MODEL_NAME).to(device)
detector_model.eval()

# Semantic Guard (The Safety Net)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# --- Helper Utilities ---

def detect_ai_probability_local(text: str) -> float:
    """Calculates probability of AI generation."""
    inputs = detector_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512).to(device)
    with torch.no_grad():
        outputs = detector_model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)
        ai_prob = probs[0][1].item()
    return ai_prob

def chunk_text(text: str, max_words: int = 150) -> list:
    """Splits long text into manageable blocks based on sentence boundaries."""
    doc = nlp(text)
    chunks = []
    current_chunk = []
    current_count = 0

    for sent in doc.sents:
        sent_text = sent.text.strip()
        word_count = len(sent_text.split())
        
        # If adding this sentence exceeds chunk size, start a new one
        if current_count + word_count > max_words and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sent_text]
            current_count = word_count
        else:
            current_chunk.append(sent_text)
            current_count += word_count
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks

def passive_to_active_variation(text: str) -> str:
    """Conservative passive voice converter."""
    doc = nlp(text)
    new_sentences = []
    for sent in doc.sents:
        rewritten = sent.text
        sent_doc = nlp(sent.text)
        for token in sent_doc:
            if token.dep_ == "nsubjpass":
                verb = None
                for child in token.head.children:
                    if child.dep_ == "auxpass":
                        verb = token.head
                if verb:
                    # Only replace the core verb phrase to keep surrounding context safe
                    pattern = r'\b(?:is|was|were|are|been|being)\s+' + re.escape(verb.text)
                    replacement = verb.lemma_
                    rewritten = re.sub(pattern, replacement, rewritten, flags=re.IGNORECASE)
        new_sentences.append(rewritten)
    return " ".join(new_sentences)

def semantic_diversifier(text: str) -> str:
    """Swaps AI-preferred phrases for natural alternatives."""
    phrase_swaps = {
        "is designed to": "is built to",
        "is capable of": "can",
        "plays an important role": "matters a lot",
        "focuses on": "mainly works on",
        "in order to": "to",
        "has the ability to": "can",
        "a wide range of": "many",
        "over time": "as time goes on"
    }
    for phrase, replacement in phrase_swaps.items():
        text = re.sub(rf"\b{phrase}\b", replacement, text, flags=re.IGNORECASE)
    return text

def grammar_and_capitalization_fix(text: str) -> str:
    """Fixes spacing and common T5-generated fragment issues."""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\.\s+(Which|That|Who|Where|While|Because)\b', r', \1', text)
    
    sentences = re.split(r'(?<=[.!?])\s+', text)
    fixed_sentences = []
    for s in sentences:
        s = s.strip()
        if s:
            fixed_sentences.append(s[0].upper() + s[1:])
    text = " ".join(fixed_sentences)
    text = re.sub(r'\s+([.,!?])', r'\1', text)
    return text

def semantic_guard(original: str, rewritten: str, threshold=0.75):
    """Compares embeddings to ensure original meaning isn't lost."""
    emb1 = embedder.encode(original, convert_to_tensor=True)
    emb2 = embedder.encode(rewritten, convert_to_tensor=True)
    similarity = util.cos_sim(emb1, emb2).item()
    return rewritten if similarity >= threshold else original

def t5_rewrite(text: str) -> str:
    """
    Paraphrases with a focus on structural variety while preventing 
    both summarization and hallucination.
    """
    prompt = f"paraphrase: {text}"
    inputs = t5_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(device)
    
    # We remove 'min_length' to prevent the model from 'babbling' to fill space.
    # Instead, we use a moderate length_penalty and sampling.
    outputs = t5_model.generate(
        **inputs, 
        max_length=512, 
        num_beams=4,                # Reduced for better coherence
        do_sample=True,             # Essential for human-like flow
        temperature=0.4,            # Lower temp = more focused, less 'wolf-chameleon' logic
        top_p=0.95,                 # Nucleus sampling for high-quality word choice
        length_penalty=1.3,         # Gentle nudge for length without forcing it
        no_repeat_ngram_size=3,     # Prevents 'animals animals animals'
        early_stopping=True
    )
    return t5_tokenizer.decode(outputs[0], skip_special_tokens=True)

# --- Main Pipeline ---

def humanize_text(text: str, tone: str = "human") -> dict:
    """
    Main entry point. Breaks text into chunks, refines them, and cleans output.
    """
    original_text = text.strip()
    if not original_text:
        return {"error": "Empty input"}

    initial_score = detect_ai_probability_local(original_text)
    
    # 1. Chunking logic for long texts
    chunks = chunk_text(original_text, max_words=150)
    processed_chunks = []

    for chunk in chunks:
        # Phase 1: Neural Rewriting per chunk
        refined_chunk = t5_rewrite(chunk)
        
        # Phase 2: Rule-Based Humanization per chunk
        refined_chunk = semantic_diversifier(refined_chunk)
        refined_chunk = passive_to_active_variation(refined_chunk)
        
        processed_chunks.append(refined_chunk)

    # Combine the processed blocks
    current_text = " ".join(processed_chunks)
    
    # Phase 3: Natural contractions based on tone
    if tone == "human":
        contractions = {"do not": "don't", "cannot": "can't", "it is": "it's", "that is": "that's"}
        for full, short in contractions.items():
            current_text = re.sub(rf"\b{full}\b", short, current_text, flags=re.IGNORECASE)

    # Phase 4: Integrity & Cleanup
    current_text = semantic_guard(original_text, current_text)
    current_text = grammar_and_capitalization_fix(current_text)
    
    final_score = detect_ai_probability_local(current_text)

    return {
        "original_text": original_text,
        "humanized_text": current_text,
        "local_ai_score": round(final_score, 4),
        "initial_ai_score": round(initial_score, 4),
        "chunks_processed": len(chunks)
    }