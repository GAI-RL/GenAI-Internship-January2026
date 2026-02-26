from __future__ import annotations

from typing import List, Optional

import arxiv
import requests

from scholarsync.models import Paper


class PaperSearchService:
    def __init__(self, timeout: int = 20):
        self.timeout = timeout

    def search(self, query: str, max_results: int = 12) -> List[Paper]:
        arxiv_target = max(4, int(max_results * 0.6))
        semsch_target = max_results

        papers: list[Paper] = []
        papers.extend(self._search_arxiv(query, arxiv_target))
        papers.extend(self._search_semantic_scholar(query, semsch_target))
        return papers

    def _search_arxiv(self, query: str, max_results: int) -> List[Paper]:
        client = arxiv.Client(page_size=min(max_results, 100), delay_seconds=1.0, num_retries=2)
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.Relevance,
            sort_order=arxiv.SortOrder.Descending,
        )

        papers: list[Paper] = []
        for result in client.results(search):
            papers.append(
                Paper(
                    title=result.title.strip(),
                    abstract=(result.summary or "").strip(),
                    authors=[a.name for a in result.authors],
                    year=result.published.year if result.published else None,
                    source="arXiv",
                    paper_url=result.entry_id,
                    pdf_url=result.pdf_url or result.entry_id,
                    venue="arXiv",
                )
            )
        return papers

    def _search_semantic_scholar(self, query: str, max_results: int) -> List[Paper]:
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": query,
            "limit": min(max_results, 100),
            "fields": "title,abstract,year,authors,venue,url,openAccessPdf,citationCount",
        }

        response = requests.get(url, params=params, timeout=self.timeout)
        response.raise_for_status()
        payload = response.json()
        data = payload.get("data", [])

        papers: list[Paper] = []
        for item in data:
            title = (item.get("title") or "").strip()
            abstract = (item.get("abstract") or "").strip()
            if not title or not abstract:
                continue

            authors = [a.get("name", "") for a in item.get("authors", []) if a.get("name")]
            paper_url = item.get("url") or ""
            pdf_url = (item.get("openAccessPdf") or {}).get("url") or paper_url

            papers.append(
                Paper(
                    title=title,
                    abstract=abstract,
                    authors=authors,
                    year=item.get("year"),
                    source="Semantic Scholar",
                    paper_url=paper_url,
                    pdf_url=pdf_url,
                    venue=item.get("venue") or "",
                    citations=item.get("citationCount"),
                )
            )
        return papers

    @staticmethod
    def safe_search(query: str, max_results: int = 12) -> List[Paper]:
        service = PaperSearchService()
        try:
            return service.search(query=query, max_results=max_results)
        except requests.RequestException:
            return service._search_arxiv(query=query, max_results=max_results)
