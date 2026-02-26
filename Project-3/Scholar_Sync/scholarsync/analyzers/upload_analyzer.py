from __future__ import annotations

import os
import re
import time
from typing import Any

import requests

from scholarsync.analyzers.section_extractor import SectionExtractor

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    PdfReader = None


SECTION_HEADINGS = {
    "literature_review": [r"related work", r"literature review", r"background"],
    "method_used": [r"method", r"methodology", r"approach", r"framework", r"experimental setup"],
    "contributions": [r"contribution", r"main contribution"],
    "limitations": [r"limitation", r"threats to validity", r"discussion"],
    "future_work": [r"future work", r"conclusion and future work"],
    "citations": [r"references", r"bibliography"],
}


def analyze_uploaded_paper(file_path: str, filename: str) -> dict[str, Any]:
    text, metadata = _extract_text_and_metadata(file_path)
    compact_text = _normalize_whitespace(text)
    extractor = SectionExtractor()

    content_for_analysis = compact_text[:25000]
    base_sections = extractor.extract(content_for_analysis)
    heading_sections = _extract_sections_by_headings(compact_text)

    merged = {
        "insights": _pick(heading_sections.get("insights"), base_sections["insights"]),
        "literature_review": _pick(heading_sections.get("literature_review"), base_sections["literature_review"]),
        "method_used": _pick(heading_sections.get("method_used"), base_sections["method_used"]),
        "contributions": _pick(heading_sections.get("contributions"), base_sections["contributions"]),
        "limitations": _pick(heading_sections.get("limitations"), base_sections["limitations"]),
        "future_work": _pick(heading_sections.get("future_work"), base_sections["future_work"]),
        "citations": _extract_citations_section(compact_text, heading_sections.get("citations")),
        "research_gap": base_sections["research_gap"],
    }
    merged = _format_section_output(merged)

    title = metadata.get("title") or _infer_title(compact_text) or filename
    title = _normalize_query_title(title)
    authors = metadata.get("authors") or _infer_authors(compact_text)
    year = metadata.get("year") or _infer_year(compact_text)
    venue = ""

    doi = _infer_doi(compact_text)
    enrich = _lookup_semantic_scholar(doi=doi, title=title)
    if not enrich:
        alt_title = _build_title_fallback(compact_text, filename)
        alt_title = _normalize_query_title(alt_title)
        enrich = _lookup_semantic_scholar(doi=doi, title=alt_title)
    if not enrich:
        filename_title = _normalize_query_title(os.path.splitext(filename)[0].replace("_", " ").replace("-", " "))
        enrich = _lookup_semantic_scholar(doi=doi, title=filename_title)
    if enrich:
        if not authors:
            authors = enrich.get("authors", [])
        if not year:
            year = enrich.get("year")
        citation_note = (
            f"Cited by approximately {enrich['citation_count']} papers (Semantic Scholar)."
            if enrich.get("citation_count") is not None
            else "Citation count unavailable in metadata."
        )
        paper_url = enrich.get("paper_url", "")
        pdf_url = enrich.get("pdf_url", "")
        venue = enrich.get("venue", "") or venue
        source = "Uploaded document + local analysis + Semantic Scholar enrichment"
    else:
        citation_note = (
            "Citation count unavailable for local upload without metadata match. "
            "Upload with DOI/title metadata for better citation retrieval."
        )
        paper_url = ""
        pdf_url = ""
        source = "Uploaded document + local analysis"

    merged["citations"] = _pick(merged["citations"], citation_note)

    return {
        "title": title,
        "authors": authors,
        "year": year,
        "venue": venue,
        "source": source,
        "paper_url": paper_url,
        "pdf_url": pdf_url,
        "filename": filename,
        "sections": merged,
    }


def _extract_text_and_metadata(file_path: str) -> tuple[str, dict[str, Any]]:
    ext = os.path.splitext(file_path)[1].lower()
    if ext in {".txt", ".md"}:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read(), {}

    if ext == ".pdf":
        if PdfReader is None:
            raise RuntimeError("pypdf is required for PDF upload support.")
        reader = PdfReader(file_path)
        parts: list[str] = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        raw_text = "\n".join(parts)
        meta = reader.metadata or {}
        title = (meta.get("/Title") or "").strip()
        author = (meta.get("/Author") or "").strip()
        create_date = str(meta.get("/CreationDate") or "")
        year_match = re.search(r"(19|20)\d{2}", create_date)
        year = int(year_match.group(0)) if year_match else None
        authors = [a.strip() for a in re.split(r"[;,]", author) if a.strip()] if author else []
        return raw_text, {"title": title, "authors": authors, "year": year}

    raise ValueError("Unsupported file type. Please upload a PDF, TXT, or MD file.")


def _extract_sections_by_headings(text: str) -> dict[str, str]:
    lines = [ln.strip() for ln in text.splitlines()]
    filtered = [ln for ln in lines if ln]
    if not filtered:
        return {}

    collected: dict[str, str] = {}
    lower_lines = [ln.lower() for ln in filtered]
    for key, patterns in SECTION_HEADINGS.items():
        idx = _find_heading_index(lower_lines, patterns)
        if idx is None:
            continue
        section_text = _collect_until_next_heading(filtered, idx + 1)
        if section_text:
            collected[key] = section_text[:2200]
    return collected


def _find_heading_index(lines: list[str], patterns: list[str]) -> int | None:
    for i, line in enumerate(lines):
        compact = re.sub(r"^\d+(\.\d+)*\s*", "", line).strip()
        for pat in patterns:
            if re.fullmatch(rf"{pat}", compact):
                return i
            if re.fullmatch(rf"{pat}\s*[:\-]?", compact):
                return i
    return None


def _collect_until_next_heading(lines: list[str], start_idx: int) -> str:
    chunks: list[str] = []
    heading_like = re.compile(r"^(\d+(\.\d+)*)?\s*[A-Z][A-Za-z0-9\s\-]{2,50}$")
    for ln in lines[start_idx:]:
        if heading_like.match(ln) and len(chunks) > 4:
            break
        chunks.append(ln)
        if len(" ".join(chunks)) > 2600:
            break
    return " ".join(chunks).strip()


def _extract_citations_section(text: str, heading_value: str | None) -> str:
    if heading_value:
        refs = re.findall(r"\[\d+\]", heading_value)
        if refs:
            return f"References section detected with at least {len(set(refs))} indexed citations."
        return "References section detected in uploaded paper."
    refs_all = re.findall(r"\[\d+\]", text)
    if refs_all:
        return f"Detected at least {len(set(refs_all))} indexed citations in the document."
    return "Citations not clearly identifiable from extracted text."


def _infer_title(text: str) -> str:
    for line in text.splitlines()[:20]:
        clean = line.strip()
        if 15 <= len(clean) <= 180 and not clean.lower().startswith(("abstract", "introduction")):
            return clean
    return ""


def _infer_authors(text: str) -> list[str]:
    lines = [ln.strip() for ln in text.splitlines()[:40] if ln.strip()]
    for ln in lines[1:8]:
        if "@" in ln:
            continue
        if len(ln) < 150 and re.search(r"\b(and|,)\b", ln.lower()):
            candidates = [x.strip() for x in re.split(r",| and ", ln) if x.strip()]
            if 1 <= len(candidates) <= 8:
                return candidates
    return []


def _infer_year(text: str) -> int | None:
    nums = re.findall(r"\b(?:19|20)\d{2}\b", text[:6000])
    if not nums:
        return None
    valid = [int(y) for y in nums if 1900 <= int(y) <= 2100]
    return valid[0] if valid else None


def _lookup_semantic_scholar(doi: str | None = None, title: str | None = None) -> dict[str, Any] | None:
    if doi:
        exact = _lookup_semantic_scholar_by_doi(doi)
        if exact:
            return exact

    if not title:
        return None
    try:
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": title,
            "limit": 5,
            "fields": "title,year,authors,venue,url,openAccessPdf,citationCount",
        }
        response_data = _request_json_with_retries(url=url, params=params, attempts=3, timeout=14)
        if not response_data:
            return None
        data = response_data.get("data", [])
        if not data:
            return None
        item = _best_title_match(title, data)
        return {
            "title": item.get("title", ""),
            "year": item.get("year"),
            "authors": [a.get("name", "") for a in item.get("authors", []) if a.get("name")],
            "venue": item.get("venue", ""),
            "paper_url": item.get("url", ""),
            "pdf_url": (item.get("openAccessPdf") or {}).get("url", ""),
            "citation_count": item.get("citationCount"),
        }
    except Exception:
        return None


def _normalize_whitespace(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _pick(primary: str | None, fallback: str) -> str:
    if primary and primary.strip():
        return primary.strip()
    return fallback


def _lookup_semantic_scholar_by_doi(doi: str) -> dict[str, Any] | None:
    try:
        doi = doi.strip().lower().rstrip(").,;")
        if not doi:
            return None
        url = f"https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}"
        params = {"fields": "title,year,authors,venue,url,openAccessPdf,citationCount"}
        item = _request_json_with_retries(url=url, params=params, attempts=3, timeout=14)
        if not item:
            return None
        return {
            "title": item.get("title", ""),
            "year": item.get("year"),
            "authors": [a.get("name", "") for a in item.get("authors", []) if a.get("name")],
            "venue": item.get("venue", ""),
            "paper_url": item.get("url", ""),
            "pdf_url": (item.get("openAccessPdf") or {}).get("url", ""),
            "citation_count": item.get("citationCount"),
        }
    except Exception:
        return None


def _infer_doi(text: str) -> str | None:
    # Standard DOI pattern (case-insensitive).
    m = re.search(r"\b10\.\d{4,9}/[-._;()/:A-Z0-9]+\b", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


def _build_title_fallback(text: str, filename: str) -> str:
    inferred = _infer_title(text)
    if inferred and len(inferred.split()) >= 4:
        return inferred
    # Use first informative sentence-like chunk.
    chunks = re.split(r"(?<=[.!?])\s+", text[:1200])
    for ch in chunks:
        clean = ch.strip()
        if 20 <= len(clean) <= 220 and len(clean.split()) >= 5:
            return clean
    return os.path.splitext(filename)[0].replace("_", " ").replace("-", " ").strip()


def _best_title_match(query_title: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    query_tokens = set(_tokenize_title(query_title))
    if not query_tokens:
        return items[0]

    def score(item: dict[str, Any]) -> float:
        cand_tokens = set(_tokenize_title(item.get("title", "")))
        if not cand_tokens:
            return 0.0
        inter = len(query_tokens.intersection(cand_tokens))
        union = len(query_tokens.union(cand_tokens))
        return inter / union if union else 0.0

    ranked = sorted(items, key=score, reverse=True)
    return ranked[0]


def _tokenize_title(text: str) -> list[str]:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    tokens = [t for t in text.split() if len(t) > 2]
    stop = {"the", "and", "for", "with", "from", "using", "study", "paper", "approach", "method"}
    return [t for t in tokens if t not in stop]


def _normalize_query_title(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"\s+", " ", text)
    text = text.strip(" .,:;()[]{}")
    return text


def _request_json_with_retries(url: str, params: dict[str, Any], attempts: int = 3, timeout: int = 12) -> dict[str, Any] | None:
    headers = {
        "User-Agent": "ScholarSync/1.0 (+local-upload-enrichment)",
    }
    for attempt in range(attempts):
        try:
            response = requests.get(url, params=params, timeout=timeout, headers=headers)
            if response.status_code in (429, 500, 502, 503, 504):
                if attempt < attempts - 1:
                    time.sleep(0.6 * (attempt + 1))
                    continue
                return None
            response.raise_for_status()
            return response.json()
        except requests.Timeout:
            if attempt < attempts - 1:
                time.sleep(0.6 * (attempt + 1))
                continue
            return None
        except requests.RequestException:
            if attempt < attempts - 1:
                time.sleep(0.6 * (attempt + 1))
                continue
            return None
    return None


def _format_section_output(sections: dict[str, str]) -> dict[str, str]:
    limits = {
        "insights": (5, 900),
        "literature_review": (4, 780),
        "method_used": (4, 780),
        "contributions": (4, 780),
        "limitations": (4, 780),
        "future_work": (4, 780),
        "research_gap": (4, 900),
    }

    cleaned: dict[str, str] = {}
    for key, value in sections.items():
        if key == "citations":
            cleaned[key] = _normalize_whitespace(value)
            continue
        sent_limit, char_limit = limits.get(key, (4, 780))
        cleaned[key] = _clean_section_text(value, max_sentences=sent_limit, max_chars=char_limit)
    return cleaned


def _clean_section_text(text: str, max_sentences: int = 4, max_chars: int = 780) -> str:
    if not text:
        return ""

    cleaned = text.replace("\x00", " ")
    cleaned = re.sub(r"(\w)-\s+(\w)", r"\1\2", cleaned)
    cleaned = re.sub(r"https?://\S+", " ", cleaned)
    cleaned = re.sub(r"\bdoi:\s*\S+", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    selected: list[str] = []
    seen: set[str] = set()

    for part in parts:
        sentence = part.strip(" -")
        if not sentence:
            continue
        if _is_noisy_sentence(sentence):
            continue
        norm = re.sub(r"\W+", "", sentence.lower())
        if not norm or norm in seen:
            continue
        seen.add(norm)
        selected.append(sentence)
        if len(selected) >= max_sentences:
            break

    if selected:
        result = " ".join(selected)
    else:
        fallback = re.sub(
            r"\b(open access|the author\(s\)|copyright|all rights reserved)\b",
            " ",
            cleaned,
            flags=re.IGNORECASE,
        )
        result = re.sub(r"\s+", " ", fallback).strip()

    if len(result) > max_chars:
        result = result[: max_chars - 3].rstrip() + "..."
    return result


def _is_noisy_sentence(sentence: str) -> bool:
    s = sentence.lower()
    if len(sentence) < 40:
        return True
    if "doi.org" in s or "open access" in s:
        return True
    if re.search(r"\b(the author\(s\)|copyright|all rights reserved)\b", s):
        return True
    if re.search(r"\b[a-z]+\s*\(\d{4}\)\s*\d+:\d+\b", s):
        return True
    if re.search(r"\babstract\b", s) and "," in sentence and sentence.count(",") > 5:
        return True
    alpha = sum(ch.isalpha() for ch in sentence)
    digits = sum(ch.isdigit() for ch in sentence)
    if alpha and (digits / alpha) > 0.30:
        return True
    return False
