# ScholarSync - Research Paper Analyzer Tool

ScholarSync is a full-stack research assistant for literature exploration and paper analysis.

It supports two workflows:
- Query-based discovery: search a topic, fetch relevant papers, and generate cross-paper analysis.
- Upload-based analysis: upload a paper (`.pdf`, `.txt`, `.md`) and extract structured insights and metadata.

The system is built with:
- Backend: FastAPI
- Frontend: React + Vite
- Analysis engine: custom Python pipeline (`scholarsync/`)

## What This System Does

### 1) Query-Based Research Analysis
Given a query (for example, `llms on health care`), ScholarSync:
1. Searches multiple academic sources (arXiv + Semantic Scholar).
2. Deduplicates and optionally filters papers by year range.
3. Extracts structured sections for each paper:
   - Insights
   - Literature Review
   - Method Used
   - Contributions
   - Limitations
   - Future Work
   - Citations
   - Research Gap
4. Produces cross-paper outputs:
   - Methodology Comparison table
   - Citations view
   - Trend Analysis
   - Structured Analysis narrative
   - Paper Similarity Network Graph

### 2) Uploaded Paper Analysis
Given an uploaded paper file, ScholarSync:
1. Extracts text and basic metadata from file content.
2. Detects section-like content from headings when available.
3. Generates the same structured section outputs as above.
4. Tries Semantic Scholar enrichment (venue, links, citation signals) using DOI/title matching.

## Core Features
- Multi-source retrieval from arXiv and Semantic Scholar.
- Year filtering (`start_year`, `end_year`) for query workflow.
- Detailed section-level extraction per paper.
- Dedicated tabs for Papers, Detailed Sections, Citations, Methodology Comparison, Trend Analysis, Structured Analysis, and Network Graph.
- Upload mode with local analysis pipeline and optional metadata enrichment.

## Architecture

### High-level components
- `frontend/`: React application (UI, tabs, rendering, user interactions)
- `backend/main.py`: FastAPI API layer
- `scholarsync/`: analysis and retrieval modules

### Backend endpoints
- `GET /api/health`
  - Health check.
- `POST /api/analyze`
  - Query-based analysis.
  - Input:
    - `query` (string, required)
    - `max_papers` (int, default 10, range 4..20)
    - `start_year` (optional int)
    - `end_year` (optional int)
  - Output includes:
    - `papers`
    - `detailed_sections`
    - `methodology_comparison`
    - `structured_analysis`
    - `network_graph`
- `POST /api/analyze-upload`
  - Upload-based analysis.
  - Accepts multipart file upload (`.pdf`, `.txt`, `.md`).

### Analysis modules
- `scholarsync/services/paper_search.py`
  - arXiv + Semantic Scholar search logic.
- `scholarsync/pipeline.py`
  - Orchestrates query workflow and year filtering.
- `scholarsync/analyzers/section_extractor.py`
  - Heuristic section extraction from text.
- `scholarsync/analyzers/corpus_analyzer.py`
  - Methodology comparison, structured analysis synthesis, network graph generation.
- `scholarsync/analyzers/upload_analyzer.py`
  - Upload parsing, local section extraction, DOI/title-based enrichment.
- `scholarsync/models.py`
  - Data models for papers and analyses.

## Project Structure

```text
LR_AI/
├─ backend/
│  └─ main.py
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│     ├─ App.jsx
│     ├─ index.css
│     └─ main.jsx
├─ scholarsync/
│  ├─ models.py
│  ├─ pipeline.py
│  ├─ analyzers/
│  ├─ services/
│  └─ utils/
├─ requirements.txt
└─ README.md
```

## Requirements

### Backend
- Python 3.10+ recommended
- Packages in `requirements.txt`

### Frontend
- Node.js 18+ recommended
- npm

## Setup

### 1) Create/activate Python environment (if needed)

Windows PowerShell:
```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 2) Install backend dependencies

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3) Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

## Run the System

Open two terminals from project root (`c:\Users\Lenovo\Downloads\LR_AI\LR_AI`).

### Terminal 1: Backend
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

Then open the Vite URL (typically `http://localhost:5173`).

## How to Use

### Query mode
1. Select `Search Query` mode.
2. Enter research query.
3. Optionally set year range and paper count.
4. Click `Analyze`.
5. Explore tabs:
   - Papers
   - Detailed Sections
   - Citations
   - Methodology Comparison
   - Trend Analysis
   - Structured Analysis
   - Paper Network Graph

### Upload mode
1. Select `Upload Paper` mode.
2. Upload `.pdf`, `.txt`, or `.md`.
3. Click `Analyze Uploaded Paper`.
4. Review extracted metadata and section outputs.

## API Example

### `POST /api/analyze`

Request:
```json
{
  "query": "llms on health care",
  "max_papers": 10,
  "start_year": 2020,
  "end_year": 2025
}
```

## Notes on Accuracy
- Section extraction is heuristic and depends on abstract/full-text quality.
- Upload enrichment relies on DOI/title match quality with Semantic Scholar.
- Some papers may not return venue/link/citation metadata if no reliable external match exists.

## Known Limitations
- Not a full semantic parser for every PDF layout.
- OCR/scanned PDFs may produce weak extraction without dedicated OCR.
- Network graph quality depends on text quality and overlap between paper abstracts.

## Troubleshooting

### Backend not starting
- Ensure venv path is correct:
  - Use `./venv/Scripts/python.exe` style on Windows PowerShell.

### Upload fails
- Verify file type is `.pdf`, `.txt`, or `.md`.
- Ensure `pypdf` is installed (`requirements.txt`).

### No papers returned
- Try broader query terms.
- Increase `max_papers`.
- Relax year filters.

### Frontend API errors
- Confirm backend is running on port `8000`.
- Confirm frontend uses `API_BASE = http://127.0.0.1:8000`.

## Security and Data Handling
- Uploaded files are processed server-side via temporary files and then removed.
- No persistent database is required for default operation.

## Future Improvements
- Better full-text section segmentation and OCR support.
- Export options (DOCX/PDF/CSV).
- Ranking controls and advanced relevance tuning.
- Caching + async job queue for large-scale runs.
