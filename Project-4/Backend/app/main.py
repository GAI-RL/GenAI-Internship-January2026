from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# ✅ Updated import (new function name)
from app.services.humanizer import humanize_text

app = FastAPI(
    title="Authentify API",
    description="Human-Centric AI Text Refinement System",
    version="2.0"
)

# --- CORS Setup ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request Model ---
class TextRequest(BaseModel):
    text: str
    tone: str = "human"


# --- Routes ---
@app.get("/")
def root():
    return {"message": "Authentify API is running (Local Mode)"}


@app.post("/refine")
def refine(request: TextRequest):
    """
    Refines text using fully local humanization pipeline.
    """

    results = humanize_text(request.text, request.tone)

    # Return ALL four fields from the humanizer
    return {
        "original_text": results["original_text"],
        "refined_text": results["humanized_text"],
        "local_ai_score": results["local_ai_score"],
        "initial_ai_score": results["initial_ai_score"]  
    }