# JobFit Simplify MVP

JobFit Simplify MVP is a small Streamlit app that helps students decide which SimplifyJobs internships or entry-level roles to apply to first. Upload a resume, fetch postings from the SimplifyJobs GitHub README, and get a ranked list with match scores, matched skills, missing skills, application links, and resume tailoring tips.

The project intentionally avoids paid APIs, authentication, databases, and complex frontend work. It is built as a clean local MVP.

## Features

- Upload resumes as PDF, DOCX, or TXT.
- Extract resume text locally.
- Fetch postings from the SimplifyJobs Summer 2026 internships repo.
- Parse changing GitHub markdown/HTML job tables.
- Extract company, role, location, application link, age, and category.
- Rank jobs using keyword similarity, skill overlap, role title fit, location preference, and posting freshness.
- Show Top 10 Apply First jobs.
- Show missing skills to learn.
- Show resume tailoring tips per job.
- Filter by role, location, company, and minimum score.
- Export ranked results to CSV.
- Save local job statuses: Saved, Applied, Skipped.

## Setup

```bash
cd /private/tmp/jobfit_simplify_mvp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

## Testing

```bash
python3 -m unittest discover
```

## Project Structure

```text
jobfit_simplify_mvp/
  app.py
  simplify_fetcher.py
  resume_utils.py
  matcher.py
  skills.py
  saved_jobs.py
  requirements.txt
  README.md
  tests/
    test_matcher.py
    test_simplify_fetcher.py
    test_skills.py
```

## Notes

The default source is:

```text
https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md
```

You can paste another compatible SimplifyJobs raw README URL in the sidebar, such as an off-season or new-grad list.

