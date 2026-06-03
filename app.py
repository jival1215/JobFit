from __future__ import annotations

import html

import pandas as pd
import streamlit as st

from matcher import missing_skills_summary, rank_jobs
from resume_utils import extract_resume_text
from saved_jobs import load_statuses, merge_statuses, save_job_status
from simplify_fetcher import DEFAULT_SIMPLIFY_URL, fetch_markdown, parse_simplify_jobs


st.set_page_config(page_title="JobFit", layout="wide")


@st.cache_data(show_spinner=False, ttl=900)
def load_jobs(repo_url: str) -> pd.DataFrame:
    markdown = fetch_markdown(repo_url)
    return parse_simplify_jobs(markdown)


def apply_filters(frame: pd.DataFrame, role_type: str, location: str, company: str, min_score: float) -> pd.DataFrame:
    filtered = frame[frame["match_score"] >= min_score].copy()
    if role_type:
        filtered = filtered[
            filtered["role"].str.contains(role_type, case=False, na=False)
            | filtered["category"].str.contains(role_type, case=False, na=False)
        ]
    if location:
        filtered = filtered[filtered["location"].str.contains(location, case=False, na=False)]
    if company:
        filtered = filtered[filtered["company"].str.contains(company, case=False, na=False)]
    return filtered


def inject_styles() -> None:
    st.markdown(
        """
        <style>
        .block-container {
            padding-top: 2rem;
            padding-bottom: 3rem;
            max-width: 1320px;
        }
        .hero {
            border: 1px solid #dfe7ee;
            background: linear-gradient(135deg, #f7fbff 0%, #f7fff9 58%, #fff9ed 100%);
            padding: 26px 30px;
            border-radius: 10px;
            margin-bottom: 22px;
        }
        .hero h1 {
            font-size: 2.35rem;
            line-height: 1.08;
            margin: 0 0 8px 0;
            color: #11202c;
            letter-spacing: 0;
        }
        .hero p {
            color: #405466;
            font-size: 1.02rem;
            margin: 0;
            max-width: 860px;
        }
        .metric-card {
            border: 1px solid #e1e8ef;
            background: #ffffff;
            border-radius: 8px;
            padding: 16px 18px;
            min-height: 92px;
        }
        .metric-label {
            color: #657587;
            font-size: 0.82rem;
            margin-bottom: 8px;
        }
        .metric-value {
            color: #142230;
            font-size: 1.75rem;
            font-weight: 760;
            line-height: 1;
        }
        .job-card {
            border: 1px solid #dde7ef;
            border-left: 5px solid #168466;
            background: #ffffff;
            border-radius: 8px;
            padding: 16px 18px;
            margin-bottom: 12px;
        }
        .job-card.maybe {
            border-left-color: #ba7a13;
        }
        .job-card.skip {
            border-left-color: #9da8b3;
        }
        .job-title {
            color: #132434;
            font-weight: 760;
            font-size: 1.02rem;
            margin: 0 0 4px 0;
        }
        .job-meta {
            color: #5d6c79;
            font-size: 0.9rem;
            margin-bottom: 10px;
        }
        .pill-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 10px 0 8px 0;
        }
        .pill {
            border: 1px solid #d9e3eb;
            background: #f7fafc;
            color: #2d4458;
            border-radius: 999px;
            padding: 3px 9px;
            font-size: 0.78rem;
            white-space: nowrap;
        }
        .score-badge {
            display: inline-block;
            background: #eaf7f1;
            color: #11674f;
            border: 1px solid #cfeade;
            border-radius: 999px;
            padding: 4px 10px;
            font-weight: 760;
            font-size: 0.85rem;
        }
        .muted-note {
            color: #637485;
            font-size: 0.9rem;
        }
        .section-label {
            color: #142230;
            font-size: 1.18rem;
            font-weight: 760;
            margin: 18px 0 10px 0;
        }
        div[data-testid="stSidebar"] {
            background: #f7fafc;
            border-right: 1px solid #e1e8ef;
        }
        div[data-testid="stButton"] button, div[data-testid="stDownloadButton"] button {
            border-radius: 7px;
            font-weight: 650;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def skill_pills(skills: str, limit: int = 6) -> str:
    values = [item.strip() for item in str(skills).split(",") if item.strip()]
    if not values:
        return '<span class="pill">No direct skills found</span>'
    shown = values[:limit]
    extra = len(values) - len(shown)
    pills = "".join(f'<span class="pill">{html.escape(skill)}</span>' for skill in shown)
    if extra > 0:
        pills += f'<span class="pill">+{extra} more</span>'
    return pills


def render_job_card(row: pd.Series, rank: int | None = None, compact: bool = False) -> None:
    rec = str(row.get("recommendation", "")).lower()
    card_class = "maybe" if "maybe" in rec else "skip" if "skip" in rec else ""
    rank_text = f"#{rank} " if rank else ""
    company = html.escape(str(row.get("company", "")))
    role = html.escape(str(row.get("role", "")))
    location = html.escape(str(row.get("location", "")))
    recommendation = html.escape(str(row.get("recommendation", "")))
    score = html.escape(str(row.get("match_score", "")))
    explanation = html.escape(str(row.get("match_explanation", "")))
    matched = skill_pills(str(row.get("matched_skills", "")), 5 if compact else 7)

    st.markdown(
        f"""
        <div class="job-card {card_class}">
            <div class="job-title">{rank_text}{company} · {role}</div>
            <div class="job-meta">{location}</div>
            <span class="score-badge">{score}/100 · {recommendation}</span>
            <div class="pill-row">{matched}</div>
            <div class="muted-note">{explanation}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_metrics(ranked_jobs: pd.DataFrame, filtered: pd.DataFrame | None = None) -> None:
    apply_count = int((ranked_jobs["recommendation"] == "Apply").sum())
    avg_score = ranked_jobs["match_score"].head(25).mean() if not ranked_jobs.empty else 0
    col1, col2, col3, col4 = st.columns(4)
    cards = [
        (col1, "Open postings parsed", f"{len(ranked_jobs):,}"),
        (col2, "Apply matches", f"{apply_count:,}"),
        (col3, "Top-25 avg score", f"{avg_score:.1f}"),
        (col4, "Visible after filters", f"{len(filtered) if filtered is not None else len(ranked_jobs):,}"),
    ]
    for col, label, value in cards:
        with col:
            st.markdown(
                f'<div class="metric-card"><div class="metric-label">{label}</div><div class="metric-value">{value}</div></div>',
                unsafe_allow_html=True,
            )


inject_styles()

st.markdown(
    """
    <div class="hero">
        <h1>JobFit</h1>
        <p>Upload your resume, refresh SimplifyJobs, and get a ranked apply-first list with skill gaps and tailoring notes.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

with st.sidebar:
    st.header("Search setup")
    repo_url = st.text_input("SimplifyJobs raw README URL", DEFAULT_SIMPLIFY_URL)
    resume_file = st.file_uploader("Resume", type=["pdf", "docx", "txt"])
    preferred_locations = st.text_input("Preferred locations", "remote, nyc, new york, new jersey, nj, philadelphia, pa")
    preferred_role_types = st.multiselect(
        "Role focus",
        ["data", "data science", "data engineering", "ai/ml", "software"],
        default=["data", "data science", "data engineering", "ai/ml"],
    )
    st.divider()
    refresh_repo = st.button("Refresh GitHub repo", use_container_width=True)
    if refresh_repo:
        load_jobs.clear()
        st.success("Repo cache cleared. Click Rank jobs to fetch fresh postings.")
    st.caption("Postings are cached for 15 minutes unless refreshed manually.")
    run_button = st.button("Rank jobs", type="primary", use_container_width=True)

if run_button:
    if not resume_file:
        st.error("Upload a PDF, DOCX, or TXT resume first.")
        st.stop()

    with st.spinner("Extracting resume text..."):
        resume_text = extract_resume_text(resume_file)
    if not resume_text:
        st.error("I could not extract text from this resume.")
        st.stop()

    with st.spinner("Fetching and parsing SimplifyJobs postings..."):
        jobs = load_jobs(repo_url)

    with st.spinner("Ranking jobs..."):
        locations = [item.strip() for item in preferred_locations.split(",") if item.strip()]
        ranked = rank_jobs(resume_text, jobs, preferred_role_types, locations)
        ranked = merge_statuses(ranked, load_statuses())
        st.session_state["ranked_jobs"] = ranked

ranked_jobs = st.session_state.get("ranked_jobs")

if ranked_jobs is None:
    left, right = st.columns([1.2, 0.8])
    with left:
        st.info("Upload your resume in the sidebar, then click Rank jobs.")
    with right:
        st.markdown(
            """
            <div class="metric-card">
                <div class="metric-label">What you will get</div>
                <div class="muted-note">A top-10 apply list, matched skills, missing skills, resume tips, CSV export, and local saved/applied/skipped tracking.</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    st.stop()

st.markdown('<div class="section-label">Overview</div>', unsafe_allow_html=True)
render_metrics(ranked_jobs)

st.markdown('<div class="section-label">Top 10 Apply First</div>', unsafe_allow_html=True)
top_10 = ranked_jobs[ranked_jobs["recommendation"] == "Apply"].head(10)
if top_10.empty:
    top_10 = ranked_jobs.head(10)

for index, (_, row) in enumerate(top_10.iterrows(), start=1):
    cols = st.columns([0.82, 0.18])
    with cols[0]:
        render_job_card(row, index, compact=True)
    with cols[1]:
        if row["application_link"]:
            st.link_button("Apply", row["application_link"], use_container_width=True)
        st.caption(str(row.get("status", "")) or "Not marked")

st.markdown('<div class="section-label">Missing Skills to Learn</div>', unsafe_allow_html=True)
missing = missing_skills_summary(ranked_jobs)
if missing.empty:
    st.write("No recurring missing skills found in the top matches.")
else:
    skill_cols = st.columns(4)
    for i, (_, row) in enumerate(missing.head(12).iterrows()):
        with skill_cols[i % 4]:
            st.markdown(
                f'<div class="metric-card"><div class="metric-label">Gap #{i + 1}</div><div class="metric-value" style="font-size:1.05rem">{html.escape(str(row["skill"]))}</div><div class="muted-note">Seen in {int(row["count"])} top jobs</div></div>',
                unsafe_allow_html=True,
            )

st.markdown('<div class="section-label">Filters</div>', unsafe_allow_html=True)
col1, col2, col3, col4 = st.columns([1, 1, 1, 1.2])
with col1:
    role_filter = st.text_input("Role contains", placeholder="data analyst")
with col2:
    location_filter = st.text_input("Location contains", placeholder="NYC")
with col3:
    company_filter = st.text_input("Company contains", placeholder="Pfizer")
with col4:
    min_score = st.slider("Minimum score", 0.0, 100.0, 50.0)

filtered = apply_filters(ranked_jobs, role_filter, location_filter, company_filter, min_score)
render_metrics(ranked_jobs, filtered)

st.markdown('<div class="section-label">Ranked Results</div>', unsafe_allow_html=True)
export_col, note_col = st.columns([0.22, 0.78])
with export_col:
    st.download_button(
        "Export CSV",
        data=filtered.to_csv(index=False).encode("utf-8"),
        file_name="jobfit_ranked_results.csv",
        mime="text/csv",
        use_container_width=True,
    )
with note_col:
    st.caption("Open a result to see why it matched, tailoring tips, and status controls.")

for _, row in filtered.head(50).iterrows():
    label = f"{row['match_score']} · {row['company']} · {row['role']}"
    with st.expander(label):
        render_job_card(row)
        detail_cols = st.columns([1, 1])
        with detail_cols[0]:
            st.write(f"**Missing skills:** {row['missing_skills'] or 'None found'}")
            st.write(f"**Resume tailoring tips:** {row['tailoring_tips']}")
        with detail_cols[1]:
            st.write(f"**Category:** {row['category']}")
            st.write(f"**Age:** {row['age']}")
            if row["application_link"]:
                st.link_button("Open application", row["application_link"])

        status = st.radio(
            "Mark job",
            ["Saved", "Applied", "Skipped"],
            horizontal=True,
            key=f"status_{row['job_id']}",
            index=None,
        )
        if status and st.button("Save status", key=f"save_{row['job_id']}"):
            save_job_status(row.to_dict(), status)
            st.success(f"Marked as {status}.")
