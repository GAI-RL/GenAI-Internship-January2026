# ScholarSync - Technical Documentation

## 1. Purpose

This document explains the internal working of ScholarSync in detail.
It is written for developers, reviewers, and advanced users who want to understand exactly how data flows through the system and how each output section is produced.

It covers:
- system architecture
- backend and frontend responsibilities
- exact query and upload pipelines
- data sources and enrichment paths
- extraction and summarization logic
- meaning of each UI section/tab
- implementation tradeoffs and limits

---

## 2. System Summary

ScholarSync is a full-stack research paper analyzer with two modes:

1. Query mode
- User enters a topic (example: `llms on health care`)
- System fetches papers from arXiv and Semantic Scholar
- System extracts section-wise insights per paper
- System builds cross-paper outputs: methodology table, trends, structured analysis, and similarity graph

2. Upload mode
- User uploads one file (`.pdf`, `.txt`, `.md`)
- System extracts text and metadata locally
- System runs section extraction on uploaded content
- System attempts Semantic Scholar enrichment for missing metadata (venue, links, citation count)

---

## 3. Technology Stack

### 3.1 Backend
- Python
- FastAPI (`backend/main.py`)
- Pydantic request validation
- requests for Semantic Scholar HTTP calls
- arxiv client for arXiv retrieval
- pypdf for PDF parsing in upload mode

### 3.2 Frontend
- React + Vite (`frontend/src/App.jsx`)
- react-markdown for proper markdown rendering in Structured Analysis
- react-plotly.js + plotly.js-dist-min for network graph

### 3.3 Analysis modules
- `scholarsync/pipeline.py`
- `scholarsync/services/paper_search.py`
- `scholarsync/analyzers/section_extractor.py`
- `scholarsync/analyzers/corpus_analyzer.py`
- `scholarsync/analyzers/upload_analyzer.py`
- `scholarsync/utils/text.py`

---

## 4. Repository Map

```text
LR_AI/
|- backend/
|  |- main.py
|- frontend/
|  |- src/
|  |  |- App.jsx
|  |  |- index.css
|  |  |- main.jsx
|  |- package.json
|- scholarsync/
|  |- models.py
|  |- pipeline.py
|  |- services/
|  |  |- paper_search.py
|  |- analyzers/
|  |  |- section_extractor.py
|  |  |- corpus_analyzer.py
|  |  |- upload_analyzer.py
|  |- utils/
|  |  |- text.py
|- requirements.txt
|- README.md
|- DOCUMENTATION.md
```

---

## 5. Runtime Architecture

High-level flow:

```text
[React Frontend]
   |
   | HTTP JSON / multipart
   v
[FastAPI Backend]
   |
   |- Query pipeline: search -> filter -> dedupe -> section extraction -> synthesis -> graph
   |
   |- Upload pipeline: parse file -> infer metadata -> section extraction -> heading merge -> enrichment
   |
   `- External APIs: arXiv + Semantic Scholar
```

Separation of concerns:
- Frontend: input collection, tabs, rendering, error/loading states.
- Backend API: validation, orchestration, response shaping.
- Analyzer layer: deterministic extraction and synthesis logic.
- Service layer: retrieval and metadata enrichment.

---

## 6. Data Models

Defined in `scholarsync/models.py`.

### 6.1 `Paper`
Fields:
- `title`
- `abstract`
- `authors` (`list[str]`)
- `year` (`int | None`)
- `source` (arXiv / Semantic Scholar)
- `paper_url`
- `pdf_url`
- `venue` (optional string)
- `citations` (optional integer)

### 6.2 `PaperAnalysis`
Per-paper extracted analysis:
- `paper` (`Paper`)
- `insights`
- `literature_review`
- `method_used`
- `contributions`
- `limitations`
- `future_work`
- `citations`
- `research_gap`

---

## 7. API Endpoints and Contracts

Implemented in `backend/main.py`.

### 7.1 `GET /api/health`
Returns:
```json
{ "status": "ok" }
```

### 7.2 `POST /api/analyze`
Request body:
```json
{
  "query": "llms on health care",
  "max_papers": 10,
  "start_year": 2020,
  "end_year": 2025
}
```

Validation:
- `query`: non-empty
- `max_papers`: 4 to 20
- `start_year`/`end_year`: 1900 to 2100
- if both provided: `start_year <= end_year`

Response includes:
- `papers`
- `detailed_sections`
- `methodology_comparison`
- `structured_analysis`
- `network_graph`
- `query`, `start_year`, `end_year`, `count`

### 7.3 `POST /api/analyze-upload`
Request:
- multipart form-data
- field: `file`
- allowed extensions: `.pdf`, `.txt`, `.md`

Behavior:
- writes temporary file
- runs upload analyzer
- deletes temporary file in `finally`

---

## 8. Query Mode Pipeline (Exact Inner Working)

Main entrypoint:
- `backend/main.py -> analyze()`
- delegates to `scholarsync/pipeline.py -> analyze_query()`

### Step 1: Retrieval (`PaperSearchService.safe_search`)
Code path: `scholarsync/services/paper_search.py`

- `search()` composes two sources:
  - arXiv target: `max(4, int(max_results * 0.6))`
  - Semantic Scholar target: `max_results`
- arXiv retrieval:
  - relevance sorting
  - extracts title, summary as abstract, authors, year, entry URL, PDF URL
- Semantic Scholar retrieval:
  - endpoint: `/graph/v1/paper/search`
  - requested fields: `title,abstract,year,authors,venue,url,openAccessPdf,citationCount`

Fallback behavior:
- if Semantic Scholar request raises HTTP/network error, `safe_search()` returns arXiv-only results.

### Step 2: Year filtering
Code path: `pipeline._filter_by_year()`

Rules:
- if year filter not provided: keep all papers
- if filter active and paper year is missing: drop that paper
- enforce bounds against `start_year` and `end_year`

### Step 3: Deduplication
Code path: `scholarsync/utils/text.py`

- normalize title:
  - lowercase
  - compact whitespace
  - remove non-alphanumeric chars
- keep first instance of each normalized title

### Step 4: Per-paper extraction
Code path: `SectionExtractor.extract()` in `section_extractor.py`

Input:
- paper abstract only (query mode does not parse full PDFs)

Process:
- split abstract into sentences via regex
- score sentences using section-specific keywords
- choose top-scoring sentences per section (`top_k` differs by section)
- apply deterministic fallback text if section signal is missing

Outputs:
- insights
- literature_review
- method_used
- contributions
- limitations
- future_work
- research_gap

Citation field in query mode:
- created from metadata in `pipeline.py`
- if `paper.citations` exists:
  - `Cited by approximately X papers (source metadata).`
- else:
  - `Citation count unavailable in source metadata.`

### Step 5: Cross-paper analysis
Code path: `scholarsync/analyzers/corpus_analyzer.py`

Artifacts:
1. Methodology table (`methodology_comparison_table`)
2. Structured markdown synthesis (`structured_analysis_markdown`)
3. Paper similarity graph (`paper_network_figure`)

### Step 6: Response shaping
Code path: `backend/main.py`

- maps backend objects to frontend JSON keys
- adds `index` for table display
- serializes Plotly figure with `to_plotly_json()`

---

## 9. Upload Mode Pipeline (Exact Inner Working)

Main entrypoint:
- `backend/main.py -> analyze_upload()`
- delegates to `scholarsync/analyzers/upload_analyzer.py -> analyze_uploaded_paper()`

### Step 1: Input validation and staging
- API rejects unsupported extension early.
- upload bytes are written to a temp file.
- temp file path is tracked and deleted in `finally`.

### Step 2: Text and metadata extraction (`_extract_text_and_metadata`)

For `.pdf`:
- `PdfReader` reads pages
- page text is concatenated
- metadata parsed from:
  - `/Title`
  - `/Author`
  - `/CreationDate` (year inferred by regex)

For `.txt` / `.md`:
- plain text read with UTF-8 (ignore errors)
- metadata starts empty

### Step 3: Base section extraction
- whitespace is normalized
- only first 25,000 chars are passed to extractor (performance bound)
- SectionExtractor generates base sections

### Step 4: Heading-aware extraction (`_extract_sections_by_headings`)
- scans line-by-line for heading patterns:
  - literature review / related work
  - method / methodology / approach
  - contributions
  - limitations
  - future work
  - references/bibliography
- collects text until next heading-like line
- heading-derived section text can override base extraction using `_pick(...)`

### Step 5: Metadata inference fallback
If metadata is incomplete, infer from content:
- title: early non-heading long-enough line
- authors: candidate name line near top
- year: first valid year found in early body
- DOI: regex extraction (`10.xxxx/...`)

### Step 6: Semantic Scholar enrichment
Method order:
1. DOI lookup (`/graph/v1/paper/DOI:{doi}`)
2. title search
3. fallback title from content/filename

Reliability tactics:
- retries with backoff for timeout/429/5xx
- query normalization
- `_best_title_match()` via token overlap score (Jaccard-like)

When enrichment succeeds:
- fills venue, URLs, citation count, and metadata fields if missing
- source label becomes:
  - `Uploaded document + local analysis + Semantic Scholar enrichment`

When enrichment fails:
- keeps local extraction only
- source label:
  - `Uploaded document + local analysis`

### Step 7: Final upload response
Returns:
- `title`, `authors`, `year`, `venue`
- `paper_url`, `pdf_url`
- `source`, `filename`
- `sections` object with all detailed section outputs

---

## 10. How Summarization Is Actually Done

Important: active pipeline uses local deterministic heuristics, not an external LLM summarizer.

### 10.1 Sentence segmentation
- regex split: punctuation + whitespace
- empty results -> section fallback text

### 10.2 Section-wise keyword scoring
In `SECTION_KEYWORDS`, each section has trigger phrases.
Examples:
- literature: `related work`, `prior work`, `baseline`
- method: `we propose`, `framework`, `architecture`, `dataset`, `evaluation`
- contributions: `novel`, `we introduce`, `improve`
- limitations: `however`, `constraint`, `drawback`

For each sentence:
- score = number of matched keywords
- keep scored sentences only
- sort descending by score
- join top-k sentences

### 10.3 Fallback behavior
If no scored sentence:
- method: first one or two sentences
- contributions: last sentence
- limitations: deterministic caution message
- future work: deterministic "not explicitly stated" message

### 10.4 Derived synthesis sections
- `insights`: templated composition of context + method + contribution
- `future_work`: inferred from limitations when explicit signal absent
- `research_gap`: synthesized from literature + limitations + future direction

This gives consistent and fast output, but quality depends on abstract/text quality.

---

## 11. Structured Analysis Generation

Function: `structured_analysis_markdown(query, analyses)`

Computation:
- time span from min/max available years
- source distribution via `Counter`
- frequent terms from token frequency (`_top_terms`)
- method pattern snippets from first few papers
- research gap snippets from first few papers

Output format:
- markdown with sections:
  - Query Focus
  - Thematic Signals
  - Cross-Paper Findings
  - Research Gap Synthesis
  - Actionable Next Steps

Frontend renders markdown using `react-markdown`, so headings/lists appear correctly.

---

## 12. Paper Network Graph Generation

Function: `paper_network_figure(analyses)`

Algorithm:
1. Build TF-IDF vectors from all abstracts (`max_features=1200`, English stopwords).
2. Compute cosine similarity matrix.
3. Build graph nodes (one per paper).
4. Add edge if similarity >= `0.12`.
5. If no edges, add weak chain edges to keep graph view readable.
6. Layout via `networkx.spring_layout(seed=42, k=1.5/sqrt(n))`.
7. Convert to Plotly edge and node traces.

Interpretation:
- edge = textual similarity in abstracts
- stronger connectivity suggests topic overlap
- this is not a citation network

---

## 13. Meaning of Every Section in UI

### Query mode tabs
- Papers: raw retrieval metadata table.
- Detailed Sections: per-paper extracted sections.
- Citations: citation text plus paper links (from metadata/extraction).
- Methodology Comparison: side-by-side method/literature/contribution/limitations rows.
- Trend Analysis: year and source distribution plus dominant terms.
- Structured Analysis: synthesized markdown narrative across paper set.
- Paper Network Graph: abstract similarity visualization.

### Detailed section definitions
- Insights: concise high-level synthesis of context and findings.
- Literature Review: signals of prior work or baseline framing.
- Method Used: technical approach and evaluation framing.
- Contributions: claimed novelty and value.
- Limitations: explicit or inferred constraints.
- Future Work: explicit or inferred next steps.
- Citations: citation metadata or references-detection summary.
- Research Gap: unresolved area synthesized from above sections.

---

## 14. Where Data Comes From

### Query mode
- arXiv API via `arxiv` client:
  - title, abstract, authors, year, links
- Semantic Scholar Graph API:
  - title, abstract, authors, year, venue, URLs, citation count

### Upload mode
- primary data: uploaded document text
- enrichment data: Semantic Scholar (if DOI/title match succeeds)

No default persistent DB:
- ScholarSync processes requests and returns JSON.
- it does not persist corpus data by default.

---

## 15. Frontend Rendering Flow

In `frontend/src/App.jsx`:
- collects query/year range/max papers
- calls `/api/analyze` for query mode
- calls `/api/analyze-upload` for upload mode
- stores response in state
- renders each tab from response keys

Important rendering details:
- markdown tab uses `react-markdown`
- graph tab renders Plotly JSON directly
- tables are generated from arrays in API response

---

## 16. Error Handling and Resilience

Backend:
- Pydantic validation for request schema
- explicit 400 for invalid year range
- explicit 400 for bad upload type
- try/except around upload analysis with meaningful `detail`
- semantic scholar retries in upload enrichment

Frontend:
- shows error messages in UI
- guards empty query submission
- loading states for analyze operations

---

## 17. Known Limitations

- Section extraction in query mode uses abstracts, not full text.
- Keyword heuristics can miss nuance or misclassify sentences.
- Upload quality depends on extractable text quality (scanned PDFs are weaker).
- External API availability affects metadata richness.
- similarity graph is lexical TF-IDF based, not semantic embedding based.

---

## 18. Performance Characteristics

- Query mode is mostly network-bound (API calls).
- Upload mode is parse-bound + optional network enrichment.
- Plotly bundle and graph rendering can be heavy for larger paper sets.

Optimization opportunities:
- cache retrieval responses
- lazy-load graph component
- background jobs for heavier analysis
- optional embedding model for better similarity quality

---

## 19. Security and Data Handling

- Upload file is temporarily stored and deleted after processing.
- No authentication/rate limiting by default.
- If deploying publicly, add auth, limits, and logging controls.

---

## 20. Setup and Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend
```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt

.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

### Frontend
```powershell

cd frontend
npm run dev
```

Open the shown Vite URL (usually `http://localhost:5173`).

---

## 21. Troubleshooting

### PowerShell path error for venv python
Use:
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

### Missing venue/link in upload mode
- enrichment depends on DOI/title match quality and API availability
- system already retries and uses fallbacks

### Structured Analysis formatting looks plain
- ensure `react-markdown` is installed in frontend
- restart frontend dev server

### Frontend cannot call backend
- backend must run at `http://127.0.0.1:8000`
- confirm frontend API base URL setting

---

## 22. Extension Guide

High-value upgrades:
- replace keyword extraction with trained section classifier
- add OCR for scanned PDF support
- add semantic embeddings for better graph accuracy
- export reports to DOCX/PDF
- add auth + persistence for user sessions

---

## 23. Quick Reference

Start backend:
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

Start frontend:
```powershell
cd frontend
npm run dev
```

Health check:
```text
GET http://127.0.0.1:8000/api/health
```

---


## 24. Evaluation Methodology

This section defines how to evaluate ScholarSync rigorously.

### 24.1 Evaluation Goals

Evaluation should answer five questions:
1. Are retrieved papers relevant to the user query?
2. Are extracted sections (method, contribution, limitations, etc.) accurate?
3. Is cross-paper synthesis (structured analysis) faithful to source papers?
4. Is metadata enrichment (venue, links, citations) reliable?
5. Is the system stable and responsive under typical load?

### 24.2 What to Evaluate

Evaluate the system as separate layers:
- Retrieval quality (query mode)
- Section extraction quality (query and upload)
- Structured synthesis quality (query mode)
- Metadata enrichment quality (upload mode)
- System performance and robustness

### 24.3 Ground Truth Preparation

Create a small labeled benchmark set before scoring:
- 50 to 100 query topics across domains (healthcare, code generation, NLP, vision, education).
- 200 to 500 papers with manually verified metadata.
- 100 uploaded PDFs/TXT/MD files with varied quality (clean PDFs, noisy PDFs, missing metadata).

For section extraction ground truth:
- Human annotators highlight text spans for:
  - literature review
  - method used
  - contributions
  - limitations
  - future work
  - citations
  - research gap
- Keep annotation guidelines fixed to reduce label drift.

### 24.4 Retrieval Evaluation (Query Mode)

For top-k papers from `/api/analyze`, compute:
- Precision@k
- Recall@k
- MRR (Mean Reciprocal Rank)
- nDCG@k (if graded relevance labels are available)

Recommended setup:
- k in {5, 10, 20}
- Use at least 2 annotators for relevance labels.
- Resolve conflicts with adjudication.

Interpretation:
- High Precision@k means visible papers are useful.
- High MRR means best paper appears early.
- nDCG captures ranking quality better when relevance is graded.

### 24.5 Section Extraction Evaluation

Compare extracted sections with human-labeled ground truth.

Use two complementary methods:
1. Span overlap metrics
- token-level Precision / Recall / F1 between extracted and gold spans.

2. Semantic similarity metrics
- BERTScore or sentence embedding cosine between extracted text and gold summary for each section.

Per-section reporting:
- F1 for literature_review
- F1 for method_used
- F1 for contributions
- F1 for limitations
- F1 for future_work
- F1 for research_gap

Also report:
- percentage of sections using fallback text (important for understanding extraction coverage).

### 24.6 Structured Analysis Evaluation

Since structured analysis is synthesized markdown, evaluate faithfulness and usefulness.

Recommended rubric (1 to 5 scale, human evaluation):
- Faithfulness: claims supported by source papers
- Coverage: major themes included
- Clarity: readable and logically organized
- Actionability: useful next-step recommendations

Automatic support checks:
- Citation/claim support rate:
  - sample claims from structured analysis and verify if evidence exists in source sections.
- Hallucination rate:
  - percentage of claims not grounded in source text.

### 24.7 Upload Metadata Enrichment Evaluation

For upload mode, evaluate enrichment success against known metadata.

Metrics:
- DOI match success rate
- Title match accuracy
- Author match accuracy
- Year accuracy
- Venue accuracy
- Paper URL validity rate
- PDF URL validity rate

Also track:
- First-attempt success rate
- Success after retries
- No-match rate

### 24.8 Trend Analysis and Graph Evaluation

Trend Analysis checks:
- Year distribution correctness (against parsed metadata)
- Source distribution correctness
- Keyword relevance judged by annotators

Graph checks:
- Edge sanity audit: sample edges should connect topically similar papers
- Cluster coherence: papers in same connected component should share topic labels

Optional quantitative graph metrics:
- modularity
- average clustering coefficient
- density

### 24.9 Performance and Reliability Evaluation

Measure on representative workload:
- Query mode latency (p50, p95, p99)
- Upload mode latency by file size bucket
- External API failure handling rate
- Timeout rate
- Memory footprint during analysis

Recommended load tests:
- 1, 5, 10 concurrent users
- mixed traffic: 70% query mode, 30% upload mode

### 24.10 Suggested Acceptance Targets (Initial)

These are reasonable initial targets for an academic project demo:
- Precision@10 >= 0.7
- MRR >= 0.6
- Section extraction macro-F1 >= 0.65
- Structured analysis faithfulness >= 4.0/5
- Upload metadata year/title accuracy >= 0.8
- Query p95 latency <= 10s (network-dependent)
- Upload p95 latency <= 12s for typical PDFs

Tune targets after first benchmark run.

### 24.11 Error Analysis Protocol

For each failed case, classify root cause:
- Retrieval miss (source API did not return relevant paper)
- Metadata mismatch (wrong title/DOI match)
- Extraction miss (keyword heuristic weak)
- Formatting/rendering issue (frontend presentation)
- External API transient failure

Maintain a failure log with:
- query/file id
- failure class
- impact severity
- proposed fix

This makes improvement cycles measurable.

### 24.12 Reproducibility Checklist

For reproducible results:
- freeze package versions (`requirements.txt`, `package-lock.json`)
- keep fixed test datasets
- store evaluation scripts and metric definitions
- report date/time and API conditions for benchmark run
- keep random seeds fixed where applicable

---
