from __future__ import annotations

import re
from typing import Dict, List


SECTION_KEYWORDS: Dict[str, List[str]] = {
    "literature_review": [
        "related work",
        "previous work",
        "prior work",
        "existing methods",
        "state-of-the-art",
        "literature",
        "baseline",
        "compared",
    ],
    "method_used": [
        "we propose",
        "our approach",
        "method",
        "framework",
        "architecture",
        "algorithm",
        "model",
        "training",
        "dataset",
        "evaluation",
        "experiment",
    ],
    "contributions": [
        "contribution",
        "we introduce",
        "we present",
        "novel",
        "new",
        "first",
        "outperform",
        "improve",
        "significant",
    ],
    "limitations": [
        "limitation",
        "however",
        "challenge",
        "constraint",
        "drawback",
        "cannot",
        "fails",
        "costly",
        "expensive",
        "still difficult",
    ],
    "future_work": [
        "future work",
        "in future",
        "further work",
        "next step",
        "can be extended",
        "promising direction",
    ],
}


class SectionExtractor:
    def __init__(self):
        self.sections = [
            "insights",
            "literature_review",
            "method_used",
            "contributions",
            "limitations",
            "future_work",
            "research_gap",
        ]

    def extract(self, abstract: str) -> Dict[str, str]:
        sentences = self._split_sentences(abstract)
        if not sentences:
            return {k: "Not enough information in abstract." for k in self.sections}

        literature_review = self._extract_section_text(sentences, "literature_review", top_k=2)
        method_used = self._extract_section_text(sentences, "method_used", top_k=3)
        contributions = self._extract_section_text(sentences, "contributions", top_k=2)
        limitations = self._extract_section_text(sentences, "limitations", top_k=2)
        future_work = self._extract_section_text(sentences, "future_work", top_k=2)

        insights = self._build_insights(sentences, method_used, contributions)

        if "Not explicitly stated" in future_work:
            future_work = self._derive_future_work(limitations)

        research_gap = self._derive_research_gap(literature_review, limitations, future_work)

        return {
            "insights": insights,
            "literature_review": literature_review,
            "method_used": method_used,
            "contributions": contributions,
            "limitations": limitations,
            "future_work": future_work,
            "research_gap": research_gap,
        }

    @staticmethod
    def _split_sentences(text: str) -> List[str]:
        text = (text or "").strip()
        if not text:
            return []
        chunks = re.split(r"(?<=[.!?])\s+", text)
        return [c.strip() for c in chunks if c.strip()]

    def _extract_section_text(self, sentences: List[str], section: str, top_k: int = 2) -> str:
        keywords = SECTION_KEYWORDS[section]
        scored: list[tuple[int, str]] = []

        for sent in sentences:
            lower = sent.lower()
            score = sum(1 for kw in keywords if kw in lower)
            if score > 0:
                scored.append((score, sent))

        if scored:
            scored.sort(key=lambda x: x[0], reverse=True)
            chosen = [s for _, s in scored[:top_k]]
            return " ".join(chosen)

        if section == "method_used":
            return " ".join(sentences[: min(2, len(sentences))])
        if section == "contributions":
            return sentences[-1]
        if section == "limitations":
            return "Not explicitly stated in the abstract; practical constraints and edge-case behavior require deeper full-text review."
        if section == "future_work":
            return "Not explicitly stated in abstract."
        return sentences[0]

    def _build_insights(self, sentences: List[str], method_used: str, contributions: str) -> str:
        core = " ".join(sentences[: min(2, len(sentences))])
        return (
            f"This paper focuses on a concrete problem setting and proposes a targeted strategy. "
            f"Core context: {core} "
            f"Technical direction: {method_used} "
            f"Main outcome: {contributions}"
        )

    @staticmethod
    def _derive_future_work(limitations: str) -> str:
        return (
            "Inferred future direction from limitations: extend evaluation across more diverse datasets, "
            "improve robustness in edge cases, and optimize efficiency for real-world deployment. "
            f"Key limitation context: {limitations}"
        )

    @staticmethod
    def _derive_research_gap(literature_review: str, limitations: str, future_work: str) -> str:
        return (
            "Current work indicates a gap between benchmark performance and reliable deployment in real settings. "
            "More standardized evaluation protocols, transparent failure analysis, and cross-domain generalization studies are needed. "
            f"Evidence from related-work context: {literature_review} "
            f"Observed constraints: {limitations} "
            f"Forward direction: {future_work}"
        )
