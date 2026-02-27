from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from scholarsync.analyzers.corpus_analyzer import (
    methodology_comparison_table,
    paper_network_figure,
    structured_analysis_markdown,
)
from scholarsync.analyzers.upload_analyzer import analyze_uploaded_paper
from scholarsync.pipeline import analyze_query


class AnalyzeRequest(BaseModel):
    query: str = Field(min_length=1)
    max_papers: int = Field(default=10, ge=4, le=20)
    start_year: int | None = Field(default=None, ge=1900, le=2100)
    end_year: int | None = Field(default=None, ge=1900, le=2100)


app = FastAPI(title="ScholarSync API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
def analyze(payload: AnalyzeRequest) -> dict[str, Any]:
    query = payload.query.strip()
    if (
        payload.start_year is not None
        and payload.end_year is not None
        and payload.start_year > payload.end_year
    ):
        raise HTTPException(status_code=400, detail="start_year cannot be greater than end_year.")

    analyses = analyze_query(
        query=query,
        max_results=payload.max_papers,
        start_year=payload.start_year,
        end_year=payload.end_year,
    )

    papers = []
    detailed_sections = []

    for idx, item in enumerate(analyses, start=1):
        paper = item.paper
        papers.append(
            {
                "index": idx,
                "source": paper.source,
                "title": paper.title,
                "authors": paper.authors,
                "venue": paper.venue,
                "paper_url": paper.paper_url,
                "pdf_url": paper.pdf_url,
                "year": paper.year,
            }
        )

        detailed_sections.append(
            {
                "index": idx,
                "title": paper.title,
                "source": paper.source,
                "year": paper.year,
                "paper_url": paper.paper_url,
                "pdf_url": paper.pdf_url,
                "insights": item.insights,
                "literature_review": item.literature_review,
                "method_used": item.method_used,
                "contributions": item.contributions,
                "limitations": item.limitations,
                "future_work": item.future_work,
                "citations": item.citations,
                "research_gap": item.research_gap,
            }
        )

    method_df = methodology_comparison_table(analyses)
    methodology_comparison = method_df.to_dict(orient="records")

    structured_analysis = structured_analysis_markdown(query, analyses)
    network_graph = paper_network_figure(analyses).to_plotly_json()

    return {
        "query": query,
        "start_year": payload.start_year,
        "end_year": payload.end_year,
        "count": len(analyses),
        "papers": papers,
        "detailed_sections": detailed_sections,
        "methodology_comparison": methodology_comparison,
        "structured_analysis": structured_analysis,
        "network_graph": network_graph,
    }


@app.post("/api/analyze-upload")
async def analyze_upload(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required.")

    suffix = file.filename.lower()
    if not suffix.endswith((".pdf", ".txt", ".md")):
        raise HTTPException(status_code=400, detail="Unsupported file type. Upload PDF, TXT, or MD.")

    import os
    import tempfile

    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp:
            content = await file.read()
            temp.write(content)
            temp_path = temp.name

        result = analyze_uploaded_paper(temp_path, file.filename)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze uploaded paper: {e}") from e
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
