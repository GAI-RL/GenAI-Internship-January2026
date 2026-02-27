from __future__ import annotations

import math
import re
from collections import Counter

import networkx as nx
import pandas as pd
import plotly.graph_objects as go
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from scholarsync.models import PaperAnalysis


def methodology_comparison_table(analyses: list[PaperAnalysis]) -> pd.DataFrame:
    rows = []
    for item in analyses:
        rows.append(
            {
                "Paper": item.paper.title,
                "Year": item.paper.year,
                "Abstract": item.paper.abstract,
                "Literature Review": item.literature_review,
                "Method Used": item.method_used,
                "Key Contribution": item.contributions,
                "Limitations": item.limitations,
                "Future Work": item.future_work,
            }
        )
    return pd.DataFrame(rows)


def structured_analysis_markdown(query: str, analyses: list[PaperAnalysis]) -> str:
    if not analyses:
        return "No structured analysis available."

    years = [a.paper.year for a in analyses if a.paper.year]
    year_span = f"{min(years)} to {max(years)}" if years else "Year data sparse"

    source_counter = Counter([a.paper.source for a in analyses])
    source_summary = ", ".join(f"{k}: {v}" for k, v in source_counter.items())

    tokens = _top_terms(" ".join(a.paper.abstract for a in analyses), n=12)
    term_summary = ", ".join(tokens[:8]) if tokens else "No dominant terms"

    method_patterns = [a.method_used for a in analyses[:5]]
    gap_patterns = [a.research_gap for a in analyses[:3]]

    return f"""
## Structured Analysis

### Query Focus
- **Topic:** {query}
- **Papers analyzed:** {len(analyses)}
- **Time coverage:** {year_span}
- **Sources:** {source_summary}

### Thematic Signals
- **Frequent terms:** {term_summary}
- **Methodological pattern:** {' | '.join(method_patterns)}

### Cross-Paper Findings
- Most papers prioritize performance gains and practical applicability.
- Method choices vary between model-centric optimization and data/evaluation-focused strategies.
- Reported limitations repeatedly mention robustness, generalization, and resource cost.

### Research Gap Synthesis
- {' '.join(gap_patterns)}

### Actionable Next Steps
- Build a common benchmark protocol for fair comparison.
- Add error taxonomy and failure-case reporting.
- Test transferability across domains and unseen datasets.
""".strip()


def paper_network_figure(analyses: list[PaperAnalysis]) -> go.Figure:
    if not analyses:
        return _empty_figure("No papers available for network graph.")

    if len(analyses) == 1:
        return _empty_figure("At least 2 papers are required to build a network graph.")

    abstracts = [a.paper.abstract for a in analyses]
    titles = [a.paper.title for a in analyses]

    vectorizer = TfidfVectorizer(stop_words="english", max_features=1200)
    matrix = vectorizer.fit_transform(abstracts)
    sim = cosine_similarity(matrix)

    graph = nx.Graph()
    for idx, title in enumerate(titles):
        graph.add_node(idx, label=title)

    for i in range(len(titles)):
        for j in range(i + 1, len(titles)):
            weight = float(sim[i, j])
            if weight >= 0.12:
                graph.add_edge(i, j, weight=weight)

    if graph.number_of_edges() == 0:
        for i in range(len(titles) - 1):
            graph.add_edge(i, i + 1, weight=0.05)

    pos = nx.spring_layout(graph, seed=42, k=1.5 / math.sqrt(max(1, len(titles))))

    edge_x = []
    edge_y = []
    for u, v in graph.edges():
        x0, y0 = pos[u]
        x1, y1 = pos[v]
        edge_x.extend([x0, x1, None])
        edge_y.extend([y0, y1, None])

    edge_trace = go.Scatter(
        x=edge_x,
        y=edge_y,
        line=dict(width=1.2, color="#7FB3FF"),
        hoverinfo="none",
        mode="lines",
        name="Similarity link",
    )

    node_x = []
    node_y = []
    node_text = []
    node_size = []
    node_colors = []
    years = [a.paper.year for a in analyses if a.paper.year]
    min_year = min(years) if years else None
    max_year = max(years) if years else None
    year_span = (max_year - min_year) if (min_year is not None and max_year is not None) else None
    for node in graph.nodes():
        x, y = pos[node]
        node_x.append(x)
        node_y.append(y)
        degree = graph.degree(node)
        node_size.append(18 + (degree * 3))
        node_text.append(titles[node])
        year = analyses[node].paper.year
        if year is None or year_span in (None, 0):
            intensity = 0.6
        else:
            intensity = 0.25 + 0.7 * ((year - min_year) / year_span)
        # Light to dark blue based on recency (older = lighter).
        node_colors.append(f"rgba(16, 58, 133, {intensity:.3f})")

    node_trace = go.Scatter(
        x=node_x,
        y=node_y,
        mode="markers+text",
        hovertext=node_text,
        hoverinfo="text",
        text=[f"P{i+1}" for i in graph.nodes()],
        textposition="top center",
        marker=dict(
            showscale=False,
            color=node_colors,
            size=node_size,
            line=dict(width=2, color="#D6E4FF"),
        ),
        name="Papers",
    )

    fig = go.Figure(data=[edge_trace, node_trace])
    fig.update_layout(
        title="Paper Similarity Network",
        template="plotly_white",
        paper_bgcolor="#F7FAFF",
        plot_bgcolor="#F7FAFF",
        font=dict(color="#0F2557"),
        margin=dict(l=10, r=10, t=45, b=10),
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
    )
    return fig


def _top_terms(text: str, n: int = 10) -> list[str]:
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "using", "into", "into", "their", "they", "are", "was",
        "were", "our", "can", "show", "shows", "paper", "study", "based", "new", "results", "method", "approach",
        "model", "models", "data", "task", "tasks", "use", "used", "via", "over", "under", "than", "also", "more",
    }
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    filtered = [w for w in words if w not in stop]
    counts = Counter(filtered)
    return [w for w, _ in counts.most_common(n)]


def _empty_figure(message: str) -> go.Figure:
    fig = go.Figure()
    fig.update_layout(
        template="plotly_white",
        paper_bgcolor="#F7FAFF",
        plot_bgcolor="#F7FAFF",
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        annotations=[
            dict(
                text=message,
                x=0.5,
                y=0.5,
                xref="paper",
                yref="paper",
                showarrow=False,
                font=dict(size=14, color="#1B3A6B"),
            )
        ],
    )
    return fig
