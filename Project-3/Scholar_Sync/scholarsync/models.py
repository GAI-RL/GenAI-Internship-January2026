from dataclasses import dataclass
from typing import Optional


@dataclass
class Paper:
    title: str
    abstract: str
    authors: list[str]
    year: Optional[int]
    source: str
    paper_url: str
    pdf_url: str
    venue: str = ""
    citations: Optional[int] = None


@dataclass
class PaperAnalysis:
    paper: Paper
    insights: str
    literature_review: str
    method_used: str
    contributions: str
    limitations: str
    future_work: str
    citations: str
    research_gap: str
