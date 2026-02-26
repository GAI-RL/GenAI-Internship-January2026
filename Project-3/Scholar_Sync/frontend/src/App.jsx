import { useEffect, useMemo, useRef, useState } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";
import ReactMarkdown from "react-markdown";
import {
  FiSearch,
  FiFileText,
  FiBarChart2,
  FiExternalLink,
  FiDownload,
  FiCalendar,
  FiUsers,
  FiCopy,
  FiCheck,
  FiUpload,
  FiBookOpen,
  FiInfo,
  FiX,
} from "react-icons/fi";
import { HiOutlineAcademicCap, HiOutlineDocumentSearch, HiOutlineLightBulb } from "react-icons/hi";
import { BsGraphUp, BsJournalText, BsBookHalf, BsQuote } from "react-icons/bs";
import { MdOutlineScience } from "react-icons/md";

const Plot = createPlotlyComponent(Plotly);

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const MODES = ["Search Query", "Upload Paper"];
const YEAR_RANGE = { start: 1900, end: new Date().getFullYear() };

const TABS = [
  { id: "papers", label: "Papers", icon: FiFileText },
  { id: "detailed-sections", label: "Detailed Sections", icon: BsJournalText },
  { id: "citations", label: "Citations", icon: BsQuote },
  { id: "methodology-comparison", label: "Methodology Comparison", icon: FiBarChart2 },
  { id: "trend-analysis", label: "Trend Analysis", icon: FiBarChart2 },
  { id: "structured-analysis", label: "Structured Analysis", icon: HiOutlineDocumentSearch },
  { id: "paper-network-graph", label: "Paper Network Graph", icon: BsGraphUp },
];

function App() {
  const [mode, setMode] = useState(MODES[0]);
  const [query, setQuery] = useState("");
  const [maxPapers, setMaxPapers] = useState(10);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  const [tab, setTab] = useState(TABS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState("guide");

  const [result, setResult] = useState({
    papers: [],
    detailed_sections: [],
    methodology_comparison: [],
    structured_analysis: "",
    network_graph: null,
  });
  const [uploadResult, setUploadResult] = useState(null);

  const hasData = result.papers.length > 0;

  const onAnalyze = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Please enter a research query.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const startYearValue = startYear ? Number(startYear) : null;
      const endYearValue = endYear ? Number(endYear) : null;
      if (startYearValue && endYearValue && startYearValue > endYearValue) {
        throw new Error("Start year cannot be greater than end year.");
      }

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          max_papers: Number(maxPapers),
          start_year: startYearValue,
          end_year: endYearValue,
        }),
      });

      if (!response.ok) {
        let detail = "";
        try {
          const errPayload = await response.json();
          detail = errPayload?.detail ? `: ${errPayload.detail}` : "";
        } catch {
          detail = "";
        }
        throw new Error(`Request failed (${response.status})${detail}`);
      }

      const payload = await response.json();
      setResult(payload);
      setUploadResult(null);

      if (!payload.papers?.length) {
        setError("No papers found for this query.");
      }
    } catch (err) {
      setError(err?.message || "Unable to fetch analysis from backend.");
    } finally {
      setLoading(false);
    }
  };

  const onAnalyzeUpload = async () => {
    if (!uploadFile) {
      setError("Please upload a paper file (PDF, TXT, or MD).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch(`${API_BASE}/api/analyze-upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "";
        try {
          const errPayload = await response.json();
          detail = errPayload?.detail ? `: ${errPayload.detail}` : "";
        } catch {
          detail = "";
        }
        throw new Error(`Upload request failed (${response.status})${detail}`);
      }

      const payload = await response.json();
      setUploadResult(payload);
      setResult({
        papers: [],
        detailed_sections: [],
        methodology_comparison: [],
        structured_analysis: "",
        network_graph: null,
      });
    } catch (err) {
      setError(err?.message || "Unable to analyze uploaded paper.");
    } finally {
      setLoading(false);
    }
  };

  const onCopy = async (text, id) => {
    await navigator.clipboard.writeText(text || "");
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const paperColumns = useMemo(
    () => ["#", "Source", "Title", "Authors", "Venue", "Paper Link", "PDF Link", "Year"],
    []
  );
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = YEAR_RANGE.end; y >= YEAR_RANGE.start; y -= 1) {
      years.push(y);
    }
    return years;
  }, []);

  const renderActiveTab = () => {
    if (tab === "papers") {
      return <PapersTable hasData={hasData} rows={result.papers} columns={paperColumns} />;
    }
    if (tab === "detailed-sections") {
      return <DetailedSections hasData={hasData} rows={result.detailed_sections} />;
    }
    if (tab === "citations") {
      return <CitationsView hasData={hasData} rows={result.detailed_sections} />;
    }
    if (tab === "methodology-comparison") {
      return <MethodologyComparison hasData={hasData} rows={result.methodology_comparison} />;
    }
    if (tab === "trend-analysis") {
      return <TrendAnalysis hasData={hasData} papers={result.papers} rows={result.detailed_sections} />;
    }
    if (tab === "structured-analysis") {
      return (
        <StructuredAnalysis
          hasData={hasData}
          text={result.structured_analysis || ""}
          onCopy={onCopy}
          copiedId={copiedId}
        />
      );
    }
    if (tab === "paper-network-graph") {
      return <NetworkGraph hasData={hasData} graph={result.network_graph} />;
    }
    return <div className="empty-state">Select a tab to view analysis.</div>;
  };

  return (
    <div className="app-shell">
      <div className="hero hero-enhanced">
        <div className="hero-layout">
          <div className="hero-main">
            <div className="hero-topline">
              <div className="hero-topline-left">
                <div className="hero-icon">
                  <HiOutlineAcademicCap size={44} />
                </div>
                <span className="hero-kicker">AI Literature Intelligence</span>
              </div>
              <button
                type="button"
                className="header-guide-btn"
                onClick={() => {
                  setGuideTab("guide");
                  setShowGuide(true);
                }}
              >
                <FiBookOpen /> <span>User Guide</span>
              </button>
            </div>
            <div className="hero-center">
              <h1 className="hero-title">
      <span className="hero-brand">ScholarSync</span>
      <span className="badge">Research Paper Analyzer</span>
    </h1>

    <p className="hero-description">
      Query multi-paper analysis and single uploaded-paper deep analysis in one interface.
    </p>
  </div>
            <div className="hero-chips">
              <span className="hero-chip"><FiFileText /> Paper Discovery</span>
              <span className="hero-chip"><FiBarChart2 /> Method Comparison</span>
              <span className="hero-chip"><BsGraphUp /> Network Insights</span>
            </div>
          </div>
          
        </div>
      </div>

      <div className="mode-tabs">
        {MODES.map((m) => (
          <button key={m} className={`tab ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>
            {m === "Search Query" ? <FiSearch /> : <FiUpload />} <span>{m}</span>
          </button>
        ))}
      </div>

      <div className="controls-panel">
        {mode === "Search Query" ? (
          <div className="search-section">
            <div className="input-group">
              <FiSearch className="input-icon" />
              <input
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., llms on health care"
              />
            </div>

            <div className="filter-group">
              <select className="select" value={maxPapers} onChange={(e) => setMaxPapers(e.target.value)}>
                {[4, 6, 8, 10, 12, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} papers
                  </option>
                ))}
              </select>

              <YearSelect
                value={startYear}
                onChange={setStartYear}
                placeholder="Start year"
                options={yearOptions}
              />

              <YearSelect
                value={endYear}
                onChange={setEndYear}
                placeholder="End year"
                options={yearOptions}
              />

              <button className={`button ${loading ? "loading" : ""}`} onClick={onAnalyze} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
        ) : (
          <div className="search-section">
            <div className="filter-group">
              <input
                className="input"
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <button className={`button ${loading ? "loading" : ""}`} onClick={onAnalyzeUpload} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Uploaded Paper"}
              </button>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {mode === "Search Query" ? (
        <>
          <div className="tabs-container">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
                <Icon /> <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="panel" key={tab}>
            {renderActiveTab()}
          </div>
        </>
      ) : (
        <div className="panel">
          <UploadedPaperView data={uploadResult} onCopy={onCopy} copiedId={copiedId} />
        </div>
      )}

      {showGuide ? (
        <GuideModal
          tab={guideTab}
          onTabChange={setGuideTab}
          onClose={() => setShowGuide(false)}
        />
      ) : null}
    </div>
  );
}

function GuideModal({ tab, onTabChange, onClose }) {
  return (
    <div className="guide-overlay" role="dialog" aria-modal="true">
      <div className="guide-modal">
        <div className="guide-header">
          <h3><FiBookOpen className="inline-icon" /> User Help</h3>
          <button type="button" className="guide-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="guide-tabs">
          <button
            type="button"
            className={`guide-tab ${tab === "guide" ? "active" : ""}`}
            onClick={() => onTabChange("guide")}
          >
            <FiBookOpen /> User Guide
          </button>
          <button
            type="button"
            className={`guide-tab ${tab === "about" ? "active" : ""}`}
            onClick={() => onTabChange("about")}
          >
            <FiInfo /> About System
          </button>
        </div>

        <div className="guide-content">
          {tab === "guide" ? (
            <>
              <h4>How to use ScholarSync</h4>
              <ol>
                <li>Choose a mode: `Search Query` for multiple papers or `Upload Paper` for one file.</li>
                <li>In query mode, enter a topic, set paper count/year range, and click Analyze.</li>
                <li>Review outputs across tabs: Papers, Detailed Sections, Citations, Trends, and Graph.</li>
                <li>In upload mode, upload `.pdf`, `.txt`, or `.md` and click Analyze Uploaded Paper.</li>
                <li>Use copy buttons in sections to quickly copy insights.</li>
              </ol>
            </>
          ) : (
            <>
              <h4>About the system</h4>
              <p>
                ScholarSync is an AI-assisted research paper analysis platform with a React frontend and FastAPI backend.
              </p>
              <ul>
                <li>Search mode retrieves papers from arXiv and Semantic Scholar.</li>
                <li>Upload mode analyzes text from your document and extracts key sections.</li>
                <li>Outputs include methodology comparison, structured analysis, citation notes, and topic graph.</li>
                <li>Designed for fast literature understanding and research gap discovery.</li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PapersTable({ hasData, rows, columns }) {
  if (!hasData) return <div className="empty-state">Run a query to see papers.</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((paper) => (
            <tr key={`${paper.index}-${paper.title}`}>
              <td>{paper.index}</td>
              <td>{paper.source}</td>
              <td>{paper.title}</td>
              <td>{(paper.authors || []).slice(0, 5).join(", ")}</td>
              <td>{paper.venue || "N/A"}</td>
              <td>
                <a href={paper.paper_url} target="_blank" rel="noreferrer">
                  Open
                </a>
              </td>
              <td>
                <a href={paper.pdf_url} target="_blank" rel="noreferrer">
                  PDF
                </a>
              </td>
              <td>{paper.year || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailedSections({ hasData, rows }) {
  if (!hasData) return <div className="empty-state">Run a query to see detailed sections.</div>;

  return (
    <div>
      {rows.map((item) => (
        <article className="section-card" key={`${item.index}-${item.title}`}>
          <h3>
            {item.index}. {item.title}
          </h3>
          <p className="muted">
            {item.source} | {item.year || "N/A"} | <a href={item.paper_url}>Paper</a> | <a href={item.pdf_url}>PDF</a>
          </p>

          <Section title="Insights" value={item.insights} icon={<HiOutlineLightBulb />} />
          <Section title="Literature Review" value={item.literature_review} icon={<BsBookHalf />} />
          <Section title="Method Used" value={item.method_used} icon={<MdOutlineScience />} />
          <Section title="Contributions" value={item.contributions} icon={<FiFileText />} />
          <Section title="Limitations" value={item.limitations} icon={<FiSearch />} />
          <Section title="Future Work" value={item.future_work} icon={<FiCalendar />} />
          <Section title="Citations" value={item.citations} icon={<BsQuote />} />
          <Section title="Research Gap" value={item.research_gap} icon={<FiBarChart2 />} />
        </article>
      ))}
    </div>
  );
}

function MethodologyComparison({ hasData, rows }) {
  if (!hasData) return <div className="empty-state">Run a query to compare methodologies.</div>;
  if (!rows?.length) return <div className="empty-state">No comparison data available.</div>;

  const columns = Object.keys(rows[0]);
  return (
    <div className="comparison-container">
      <div className="table-wrap comparison-table">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td
                    key={`${idx}-${col}`}
                    className={
                      col === "Abstract"
                        ? "comparison-cell-abstract"
                        : col === "Future Work"
                          ? "comparison-cell-future-work"
                          : col === "Method Used"
                            ? "comparison-cell-method-used"
                          : undefined
                    }
                  >
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CitationsView({ hasData, rows }) {
  if (!hasData) return <div className="empty-state">Run a query to see citations.</div>;
  if (!rows?.length) return <div className="empty-state">No citation data available.</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Paper</th>
            <th>Year</th>
            <th>Source</th>
            <th>Paper Link</th>
            <th>Citation Insight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`citation-${row.index}-${row.title}`}>
              <td>{row.index}</td>
              <td>{row.title}</td>
              <td>{row.year || "N/A"}</td>
              <td>{row.source || "N/A"}</td>
              <td>
                {row.paper_url ? (
                  <a href={row.paper_url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  "N/A"
                )}
              </td>
              <td>{row.citations || "No citation note available."}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendAnalysis({ hasData, papers, rows }) {
  if (!hasData) return <div className="empty-state">Run a query to see trend analysis.</div>;

  const yearCounts = {};
  for (const p of papers || []) {
    if (!p.year) continue;
    yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
  }
  const yearTrend = Object.entries(yearCounts).sort((a, b) => Number(a[0]) - Number(b[0]));

  const sourceCounts = {};
  for (const p of papers || []) {
    const source = p.source || "Unknown";
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }

  const combinedText = (rows || [])
    .map((r) => [r.literature_review, r.method_used, r.contributions, r.limitations].join(" "))
    .join(" ");
  const keywords = extractTopKeywords(combinedText, 12);

  return (
    <div>
      <div className="section-card">
        <h3>Publication Trend</h3>
        {yearTrend.length ? (
          <ul>
            {yearTrend.map(([year, count]) => (
              <li key={`trend-${year}`}>
                {year}: {count} paper{count > 1 ? "s" : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>No year trend available.</p>
        )}
      </div>

      <div className="section-card">
        <h3>Source Distribution</h3>
        <ul>
          {Object.entries(sourceCounts).map(([source, count]) => (
            <li key={`source-${source}`}>
              {source}: {count}
            </li>
          ))}
        </ul>
      </div>

      <div className="section-card">
        <h3>Theme Keywords</h3>
        <p>{keywords.length ? keywords.join(", ") : "No dominant keywords extracted."}</p>
      </div>
    </div>
  );
}

function extractTopKeywords(text, topN = 10) {
  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "from", "using", "are", "was", "were", "our", "can", "show",
    "shows", "paper", "study", "based", "results", "method", "approach", "model", "models", "data", "task",
    "tasks", "use", "used", "via", "over", "under", "than", "also", "more", "into", "their", "they",
  ]);
  const words = (text || "").toLowerCase().match(/[a-z]{4,}/g) || [];
  const freq = {};
  for (const w of words) {
    if (stopWords.has(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

function StructuredAnalysis({ hasData, text, onCopy, copiedId }) {
  if (!hasData) return <div className="empty-state">Run a query to see structured analysis.</div>;

  return (
    <div>
      <button className="icon-button" onClick={() => onCopy(text, "analysis")}>{copiedId === "analysis" ? <FiCheck /> : <FiCopy />}</button>
      <div className="markdown markdown-rendered"><ReactMarkdown>{text}</ReactMarkdown></div>
    </div>
  );
}

function NetworkGraph({ hasData, graph }) {
  if (!hasData) return <div className="empty-state">Run a query to see the network graph.</div>;
  if (!graph) return <div className="empty-state">No graph available.</div>;

  return (
    <div className="graph-color-scale">
      <div className="graph-scale-labels">
        <span>Older</span>
        <span>Newer</span>
      </div>
      <div className="graph-scale-bar" aria-hidden="true" />
      <Plot
        data={graph.data || []}
        layout={{ ...(graph.layout || {}), autosize: true, height: 620 }}
        style={{ width: "100%", minHeight: 620 }}
        config={{ responsive: true, displaylogo: false }}
      />
    </div>
  );
}

function UploadedPaperView({ data, onCopy, copiedId }) {
  if (!data) return <div className="empty-state">Upload a paper to get full single-paper analysis.</div>;
  const sections = data.sections || {};

  return (
    <article className="section-card">
      <h3>{data.title || "Uploaded Paper"}</h3>
      <p className="muted">{data.source || "Uploaded document"}</p>
      <p><FiUsers className="inline-icon" /> <strong>Authors:</strong> {(data.authors || []).join(", ") || "Not available"}</p>
      <p><FiCalendar className="inline-icon" /> <strong>Year:</strong> {data.year || "Not available"}</p>
      <p><strong>Venue:</strong> {data.venue || "Not available"}</p>
      <p>
        <strong>Paper Link:</strong> {data.paper_url ? <a href={data.paper_url} target="_blank" rel="noreferrer"><FiExternalLink /> Open</a> : " Not available"}
      </p>
      <p>
        <strong>PDF Link:</strong> {data.pdf_url ? <a href={data.pdf_url} target="_blank" rel="noreferrer"><FiDownload /> Open</a> : " Not available"}
      </p>

      <Section title="Insights" value={sections.insights} icon={<HiOutlineLightBulb />} onCopy={onCopy} copiedId={copiedId} id="upload-insights" />
      <Section title="Literature Review" value={sections.literature_review} icon={<BsBookHalf />} onCopy={onCopy} copiedId={copiedId} id="upload-lit" />
      <Section title="Methodology" value={sections.method_used} icon={<MdOutlineScience />} onCopy={onCopy} copiedId={copiedId} id="upload-method" />
      <Section title="Contributions" value={sections.contributions} icon={<FiFileText />} onCopy={onCopy} copiedId={copiedId} id="upload-contrib" />
      <Section title="Limitations" value={sections.limitations} icon={<FiSearch />} onCopy={onCopy} copiedId={copiedId} id="upload-lim" />
      <Section title="Future Work" value={sections.future_work} icon={<FiCalendar />} onCopy={onCopy} copiedId={copiedId} id="upload-future" />
      <Section title="Citations" value={sections.citations} icon={<BsQuote />} onCopy={onCopy} copiedId={copiedId} id="upload-cite" />
      <Section title="Research Gap" value={sections.research_gap} icon={<FiBarChart2 />} onCopy={onCopy} copiedId={copiedId} id="upload-gap" />
    </article>
  );
}

function Section({ title, value, icon, onCopy, copiedId, id }) {
  return (
    <div className="section-item">
      <h4 className="section-title">
        {icon} <span>{title}</span>
        {onCopy ? (
          <button className="copy-btn-small" onClick={() => onCopy(value || "", id)}>
            {copiedId === id ? <FiCheck /> : <FiCopy />}
          </button>
        ) : null}
      </h4>
      <p>{value || "Not available."}</p>
    </div>
  );
}

function YearSelect({ value, onChange, placeholder, options }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const label = value ? value : placeholder;

  return (
    <div className="year-select" ref={containerRef}>
      <button type="button" className="year-select-trigger" onClick={() => setOpen((prev) => !prev)}>
        {label}
      </button>
      {open ? (
        <div className="year-select-menu">
          <button type="button" className="year-option" onClick={() => { onChange(""); setOpen(false); }}>
            {placeholder}
          </button>
          {options.map((year) => (
            <button
              type="button"
              key={`year-${year}`}
              className="year-option"
              onClick={() => { onChange(String(year)); setOpen(false); }}
            >
              {year}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default App;
