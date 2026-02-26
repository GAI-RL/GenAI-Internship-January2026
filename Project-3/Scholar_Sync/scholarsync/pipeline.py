from __future__ import annotations

from scholarsync.analyzers.section_extractor import SectionExtractor
from scholarsync.models import PaperAnalysis
from scholarsync.services.paper_search import PaperSearchService
from scholarsync.utils.text import dedupe_by_title


def analyze_query(
    query: str,
    max_results: int = 12,
    start_year: int | None = None,
    end_year: int | None = None,
) -> list[PaperAnalysis]:
    papers = PaperSearchService.safe_search(query=query, max_results=max_results)
    papers = _filter_by_year(papers, start_year=start_year, end_year=end_year)
    papers = dedupe_by_title(papers, lambda p: p.title)
    papers = papers[:max_results]

    extractor = SectionExtractor()
    results: list[PaperAnalysis] = []

    for paper in papers:
        sections = extractor.extract(paper.abstract)
        citation_text = (
            f"Cited by approximately {paper.citations} papers (source metadata)."
            if paper.citations is not None
            else "Citation count unavailable in source metadata."
        )

        results.append(
            PaperAnalysis(
                paper=paper,
                insights=sections["insights"],
                literature_review=sections["literature_review"],
                method_used=sections["method_used"],
                contributions=sections["contributions"],
                limitations=sections["limitations"],
                future_work=sections["future_work"],
                citations=citation_text,
                research_gap=sections["research_gap"],
            )
        )

    return results


def _filter_by_year(papers, start_year: int | None, end_year: int | None):
    if start_year is None and end_year is None:
        return papers

    filtered = []
    for paper in papers:
        if paper.year is None:
            continue
        if start_year is not None and paper.year < start_year:
            continue
        if end_year is not None and paper.year > end_year:
            continue
        filtered.append(paper)
    return filtered
