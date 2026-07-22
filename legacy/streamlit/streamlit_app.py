from __future__ import annotations

import html
from datetime import date

import pandas as pd
import streamlit as st

from job_scout import mark_new_jobs
from matcher import missing_skills_summary, rank_jobs
from resume_utils import extract_resume_text
from saved_jobs import load_statuses, merge_statuses, save_job_status, tracker_summary
from simplify_fetcher import JOB_SOURCES, fetch_markdown, parse_simplify_jobs


st.set_page_config(page_title="JobFIT", layout="wide")

ROLE_DEFAULTS = ["data", "data science", "data engineering", "ai/ml"]
LOCATION_DEFAULTS = "remote, nyc, new york, new jersey, nj, philadelphia, pa, united states, usa"


@st.cache_data(show_spinner=False, ttl=900)
def load_jobs(repo_url: str, source_name: str) -> pd.DataFrame:
    markdown = fetch_markdown(repo_url)
    frame = parse_simplify_jobs(markdown)
    if not frame.empty:
        frame["source"] = source_name
    return frame


def apply_filters(frame: pd.DataFrame, role_type: str, location: str, company: str, min_score: float, only_new: bool) -> pd.DataFrame:
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
    if only_new and "is_new" in filtered:
        filtered = filtered[filtered["is_new"] == True]
    return filtered


def inject_styles() -> None:
    st.markdown(
        """
        <style>
        :root {
            --black: #050505;
            --off: #f4f0ed;
            --panel: #fbf8f5;
            --muted: #6f6964;
            --line: #252525;
            --lime: #cfff68;
            --soft: #e4ddd8;
        }
        .stApp { background: var(--off); color: var(--black); }
        .block-container { max-width: 1440px; padding: 0 2.4rem 3.5rem; }
        .top-nav {
            position: sticky; top: 0; z-index: 3;
            display: flex; align-items: center; justify-content: space-between;
            padding: 18px 0 14px; background: rgba(244,240,237,.94);
            border-bottom: 1px solid rgba(5,5,5,.12); backdrop-filter: blur(10px);
        }
        .brand { font-weight: 950; letter-spacing: 0; font-size: 1.15rem; }
        .nav-links { display: flex; gap: 22px; color: var(--muted); font-size: .9rem; }
        .hero {
            min-height: 560px; background: var(--black); color: var(--off);
            padding: clamp(36px, 6vw, 82px); margin: 0 0 54px 0;
            display: flex; flex-direction: column; justify-content: space-between;
        }
        .hero-kicker { color: var(--lime); text-transform: uppercase; letter-spacing: .14em; font-size: .78rem; font-weight: 850; margin-bottom: 18px; }
        .hero h1 { color: var(--off); font-size: clamp(4.2rem, 10vw, 10rem); line-height: .84; margin: 0; font-weight: 950; letter-spacing: 0; max-width: 1050px; }
        .hero-bottom { display: grid; grid-template-columns: 1.2fr .8fr; gap: 32px; align-items: end; margin-top: 48px; }
        .hero p { color: #d8d2ce; font-size: 1.08rem; max-width: 680px; margin: 0; }
        .hero-stat { border: 1px solid #56514d; padding: 22px; color: var(--off); }
        .hero-stat strong { display: block; font-size: 2.4rem; line-height: 1; margin-bottom: 8px; }
        .section-label { color: var(--black); font-size: clamp(2.8rem, 6vw, 6.4rem); line-height: .9; font-weight: 950; margin: 58px 0 18px 0; letter-spacing: 0; }
        .subtle-copy { color:#4f4a47; font-size:1rem; margin:-4px 0 22px 0; max-width:820px; }
        .start-panel {
            border: 1px solid var(--line); background: var(--panel); padding: 30px;
            display: grid; gap: 28px; margin-bottom: 34px;
        }
        div[data-testid="stForm"], div[data-testid="stVerticalBlockBorderWrapper"] { border-color: var(--line) !important; border-radius: 0 !important; background: var(--panel); }
        div[data-testid="stForm"] { padding: 26px; }
        .step-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 24px; }
        .step-card { border: 1px solid var(--line); min-height: 170px; padding: 22px; background: transparent; display:flex; flex-direction:column; justify-content:space-between; }
        .step-card span { color: var(--muted); font-size: .82rem; text-transform: uppercase; letter-spacing:.08em; font-weight: 800; }
        .step-card strong { font-size: 1.35rem; line-height: 1.1; }
        .metric-card { border: 1px solid var(--line); background: transparent; border-radius: 0; padding: 20px 22px; min-height: 112px; }
        .metric-label { color:#4d4946; font-size:.78rem; text-transform:uppercase; letter-spacing:.07em; font-weight:800; margin-bottom:12px; }
        .metric-value { color:var(--black); font-size:2rem; font-weight:950; line-height:1; }
        .job-card { border:1px solid var(--line); background:var(--panel); border-radius:0; padding:22px 24px; margin-bottom:12px; }
        .job-title { color:var(--black); font-weight:950; font-size:1.12rem; margin:0 0 7px 0; }
        .job-meta { color:#5d5855; font-size:.9rem; margin-bottom:14px; }
        .pill-row { display:flex; flex-wrap:wrap; gap:8px; margin:14px 0 10px 0; }
        .pill { border:1px solid #c7c0bc; background:#e5ded9; color:var(--black); border-radius:999px; padding:5px 10px; font-size:.78rem; white-space:nowrap; }
        .score-badge,.new-badge { display:inline-block; background:var(--lime); color:var(--black); border:1px solid var(--black); border-radius:999px; padding:5px 12px; font-weight:900; font-size:.84rem; margin-right:6px; }
        .new-badge { background:#fff; }
        .muted-note { color:#4f4a47; font-size:.93rem; }
        .tip-box { border:1px solid var(--line); border-radius:0; padding:16px 18px; background:transparent; color:var(--black); white-space:pre-line; }
        .filter-panel { border:1px solid var(--line); background: var(--panel); padding:24px; margin-bottom:22px; }
        .apply-link { display:block; width:100%; text-align:center; background:var(--lime); color:var(--black)!important; text-decoration:none!important; border-radius:999px; padding:.62rem .9rem; font-weight:950; border:1px solid var(--black); margin-bottom:8px; }
        .plain-link { color:#3c3937; font-size:.82rem; overflow-wrap:anywhere; text-decoration:underline; }
        label, div[data-testid="stWidgetLabel"] p, div[data-testid="stCaptionContainer"] p { color: var(--black) !important; font-weight: 800; }
        div[data-testid="stCheckbox"] label p { font-size:.86rem; font-weight:750; }
        div[data-testid="stButton"] button, div[data-testid="stDownloadButton"] button { border-radius:999px; font-weight:900; border:1px solid var(--black); background:var(--lime); color:var(--black); }
        div[data-testid="stButton"] button:hover, div[data-testid="stDownloadButton"] button:hover { background:#bdf05b; border-color:var(--black); color:var(--black); }
        div[data-testid="stTextInput"] input, div[data-testid="stSelectbox"] div, div[data-testid="stMultiSelect"] div { background:#fffdfb; color:var(--black); border-color:#7c756f; border-radius: 3px; }
        div[data-testid="stFileUploader"] section { background:var(--black); color:var(--off); border:1px solid var(--line); min-height:150px; display:flex; align-items:center; justify-content:center; }
        div[data-testid="stFileUploader"] section * { color:var(--off) !important; }
        div[data-testid="stFileUploader"] button { background:var(--lime); color:var(--black) !important; border:1px solid var(--black); }
        div[data-testid="stExpander"] { border:1px solid var(--line); border-radius:0; background:var(--panel); }
        div[data-testid="stTabs"] button p { color:var(--black); font-weight:950; font-size:1rem; }
        div[data-testid="stTabs"] [aria-selected="true"] { background:var(--lime); border-radius:999px; }
        @media (max-width: 900px) {
            .block-container { padding-left: 1rem; padding-right: 1rem; }
            .hero-bottom, .step-row { grid-template-columns: 1fr; }
            .hero { min-height: auto; }
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


def render_apply_button(url: str, label: str = "Apply") -> None:
    url = str(url or "").strip()
    if not url:
        st.caption("No application link found")
        return
    safe_url = html.escape(url, quote=True)
    safe_label = html.escape(label)
    st.markdown(f'<a class="apply-link" href="{safe_url}" target="_blank" rel="noopener noreferrer">{safe_label}</a>', unsafe_allow_html=True)
    st.markdown(f'<a class="plain-link" href="{safe_url}" target="_blank" rel="noopener noreferrer">Open in new tab</a>', unsafe_allow_html=True)


def render_job_card(row: pd.Series, rank: int | None = None, compact: bool = False) -> None:
    rank_text = f"#{rank} " if rank else ""
    new_badge = '<span class="new-badge">NEW</span>' if bool(row.get("is_new", False)) else ""
    st.markdown(
        f"""
        <div class="job-card">
            <div class="job-title">{rank_text}{html.escape(str(row.get('company','')))} · {html.escape(str(row.get('role','')))}</div>
            <div class="job-meta">{html.escape(str(row.get('location','')))} · {html.escape(str(row.get('source','')))}</div>
            <span class="score-badge">{html.escape(str(row.get('match_score','')))}/100 · {html.escape(str(row.get('recommendation','')))}</span>{new_badge}
            <div class="pill-row">{skill_pills(str(row.get('matched_skills','')), 5 if compact else 7)}</div>
            <div class="muted-note">{html.escape(str(row.get('match_explanation','')))}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_metric_cards(items: list[tuple[str, str]]) -> None:
    cols = st.columns(len(items))
    for col, (label, value) in zip(cols, items):
        with col:
            st.markdown(f'<div class="metric-card"><div class="metric-label">{html.escape(label)}</div><div class="metric-value">{html.escape(value)}</div></div>', unsafe_allow_html=True)


def rank_source(resume_file, source_name: str, preferred_roles: list[str], preferred_locations: list[str]) -> None:
    if resume_file is None:
        st.error("Upload a resume first.")
        return
    load_jobs.clear()
    with st.spinner("Reading resume..."):
        resume_text = extract_resume_text(resume_file)
    if not resume_text:
        st.error("I could not extract text from this resume.")
        return
    with st.spinner(f"Job Scout refreshing {source_name}..."):
        jobs = load_jobs(JOB_SOURCES[source_name], source_name)
        jobs = mark_new_jobs(jobs, source_name)
    with st.spinner("Ranking jobs and generating apply plans..."):
        ranked = rank_jobs(resume_text, jobs, preferred_roles, preferred_locations)
        ranked = merge_statuses(ranked, load_statuses())
    st.session_state["ranked_jobs"] = ranked
    st.session_state["source_name"] = source_name


inject_styles()
st.markdown(
    '''
    <div class="top-nav">
        <div class="brand">JobFIT</div>
        <div class="nav-links"><span>Scout</span><span>Rank</span><span>Apply Plan</span><span>Track</span></div>
    </div>
    <div class="hero">
        <div>
            <div class="hero-kicker">Resume intelligence for internships and new grad roles</div>
            <h1>JobFIT</h1>
        </div>
        <div class="hero-bottom">
            <p>Upload your resume, refresh real SimplifyJobs postings, and let local agents scout new jobs, rank your fit, generate apply plans, and track follow-ups.</p>
            <div class="hero-stat"><strong>3 agents</strong><span>Scout, tailor, and track without paid APIs.</span></div>
        </div>
    </div>
    ''',
    unsafe_allow_html=True,
)

st.markdown('<div class="section-label">Your system starts here.</div>', unsafe_allow_html=True)
st.markdown('<p class="subtle-copy">Three steps: upload your resume, choose the market, then run the scout. The rest of the product unfolds in focused tabs.</p>', unsafe_allow_html=True)
st.markdown('''<div class="step-row"><div class="step-card"><span>Step 1</span><strong>Upload your resume</strong></div><div class="step-card"><span>Step 2</span><strong>Select the job source</strong></div><div class="step-card"><span>Step 3</span><strong>Rank and build apply plans</strong></div></div>''', unsafe_allow_html=True)
with st.form("start_form", border=True):
    col_a, col_b = st.columns([1.08, 0.92])
    with col_a:
        resume_file = st.file_uploader("Upload resume", type=["pdf", "docx", "txt"])
    with col_b:
        source_name = st.selectbox("Job source", list(JOB_SOURCES.keys()))
        preferred_locations = st.text_input("Preferred locations", LOCATION_DEFAULTS)
        st.markdown("**Role focus**")
        role_options = ["data", "data science", "data engineering", "ai/ml", "software"]
        role_cols = st.columns(len(role_options))
        preferred_roles = []
        for role_col, role in zip(role_cols, role_options):
            with role_col:
                if st.checkbox(role, value=role in ROLE_DEFAULTS, key=f"role_focus_{role}"):
                    preferred_roles.append(role)
        submitted = st.form_submit_button("Run Job Scout + Rank", type="primary", use_container_width=True)

if submitted:
    locations = [item.strip() for item in preferred_locations.split(",") if item.strip()]
    rank_source(resume_file, source_name, preferred_roles, locations)

ranked_jobs = st.session_state.get("ranked_jobs")
statuses = load_statuses()
summary = tracker_summary(statuses)

if ranked_jobs is None:
    st.markdown('<div class="section-label">Application Tracker</div>', unsafe_allow_html=True)
    render_metric_cards([(label, str(value)) for label, value in summary.items()])
    st.info("Upload your resume and run Job Scout + Rank to see ranked jobs, apply plans, and tracker details.")
    st.stop()

new_count = int(ranked_jobs.get("is_new", pd.Series(False, index=ranked_jobs.index)).sum())
render_metric_cards([
    ("Source", str(st.session_state.get("source_name", ""))),
    ("Postings scanned", f"{len(ranked_jobs):,}"),
    ("New since last scan", f"{new_count:,}"),
    ("Apply matches", f"{int((ranked_jobs['recommendation'] == 'Apply').sum()):,}"),
])

results_tab, plans_tab, tracker_tab = st.tabs(["Ranked Jobs", "Apply Plans", "Tracker"])

with results_tab:
    st.markdown('<div class="section-label">Filters</div>', unsafe_allow_html=True)
    st.markdown('<p class="subtle-copy">Narrow the ranked list without losing the original score order.</p>', unsafe_allow_html=True)
    with st.container(border=True):
        f1, f2, f3, f4 = st.columns([1, 1, 1, 0.9])
        with f1:
            role_filter = st.text_input("Role", placeholder="Data Analyst")
        with f2:
            location_filter = st.text_input("Location", placeholder="NYC, Remote, New Jersey")
        with f3:
            company_filter = st.text_input("Company", placeholder="Pfizer")
        with f4:
            min_score = st.slider("Minimum score", 0.0, 100.0, 50.0)
        only_new = st.checkbox("Only new jobs", value=False)

    filtered = apply_filters(ranked_jobs, role_filter, location_filter, company_filter, min_score, only_new)
    export_col, note_col = st.columns([0.22, 0.78])
    with export_col:
        st.download_button("Export CSV", data=filtered.to_csv(index=False).encode("utf-8"), file_name="jobfit_ranked_results.csv", mime="text/csv", use_container_width=True)
    with note_col:
        st.caption(f"Showing {len(filtered):,} ranked jobs. Open a job to see the full apply plan and tracker controls.")

    for index, (_, row) in enumerate(filtered.head(75).iterrows(), start=1):
        label = f"{row['match_score']} · {row['company']} · {row['role']}"
        with st.expander(label):
            render_job_card(row, index)
            left, right = st.columns([0.66, 0.34])
            with left:
                st.markdown(f'<div class="tip-box"><strong>Generated Apply Plan</strong>\n{html.escape(str(row.get("apply_plan", "")))}</div>', unsafe_allow_html=True)
                st.write(f"**Score breakdown:** {row.get('score_breakdown', '')}")
                st.write(f"**Missing skills:** {row.get('missing_skills', '') or 'None found'}")
            with right:
                render_apply_button(row["application_link"], "Open application")
                status_options = ["Saved", "Applied", "Skipped"]
                existing_status = str(row.get("status", ""))
                status_index = status_options.index(existing_status) if existing_status in status_options else None
                status = st.radio("Mark job", status_options, horizontal=True, key=f"status_{row['job_id']}", index=status_index)
                notes = st.text_area("Notes", value=str(row.get("notes", "")), key=f"notes_{row['job_id']}", height=80)
                applied_date = st.text_input("Applied date", value=str(row.get("applied_date", "")), placeholder=str(date.today()), key=f"applied_{row['job_id']}")
                follow_up_date = st.text_input("Follow-up date", value=str(row.get("follow_up_date", "")), placeholder=str(date.today()), key=f"follow_{row['job_id']}")
                if status and st.button("Save tracker update", key=f"save_{row['job_id']}"):
                    save_job_status(row.to_dict(), status, notes, applied_date, follow_up_date)
                    st.session_state["ranked_jobs"] = merge_statuses(
                        ranked_jobs.drop(columns=[col for col in ["status", "notes", "applied_date", "follow_up_date"] if col in ranked_jobs.columns]),
                        load_statuses(),
                    )
                    st.success(f"Marked as {status}.")

with plans_tab:
    st.markdown('<div class="section-label">Apply Plans</div>', unsafe_allow_html=True)
    st.markdown('<p class="subtle-copy">A focused view of what to improve before applying.</p>', unsafe_allow_html=True)
    missing = missing_skills_summary(ranked_jobs)
    if not missing.empty:
        st.caption("Most common skill gaps across your top matches")
        st.dataframe(missing.head(10), use_container_width=True, hide_index=True)
    for index, (_, row) in enumerate(ranked_jobs.head(15).iterrows(), start=1):
        with st.expander(f"#{index} {row['company']} · {row['role']}"):
            st.markdown(f'<div class="tip-box">{html.escape(str(row.get("apply_plan", "")))}</div>', unsafe_allow_html=True)

with tracker_tab:
    st.markdown('<div class="section-label">Application Tracker</div>', unsafe_allow_html=True)
    render_metric_cards([(label, str(value)) for label, value in summary.items()])
    if statuses.empty:
        st.info("No saved/applied/skipped jobs yet. Mark jobs from the Results tab to start tracking.")
    else:
        st.dataframe(statuses[["company", "role", "status", "applied_date", "follow_up_date", "notes"]], use_container_width=True, hide_index=True)
