import unittest

import pandas as pd

from backend_api import _records_from_ranked


class BackendApiTests(unittest.TestCase):
    def test_records_include_resume_bullet_changes(self):
        ranked = pd.DataFrame([
            {
                "job_id": "example|data science|https://example.com",
                "company": "Example",
                "role": "Data Science Intern",
                "location": "Remote",
                "source": "Summer internships",
                "match_score": 91,
                "recommendation": "Apply",
                "age": "1d",
                "application_link": "https://example.com",
                "matched_skills": "Python, SQL, machine learning",
                "missing_skills": "AWS",
                "match_explanation": "Strong overlap.",
                "tailoring_tips": "Lead with ML project.",
                "apply_plan": "Why you match: strong overlap.",
            }
        ])
        resume_text = """
Built a machine learning dashboard with Python and SQL to analyze customer trends and improve reporting speed.
Created a Flask web app for tracking flights using APIs and relational database tables.
"""

        job = _records_from_ranked(ranked, resume_text)[0]

        self.assertIn("resumeBulletChanges", job)
        self.assertTrue(job["resumeBulletChanges"])
        self.assertIn("Python", job["resumeBulletChanges"][0]["suggestion"])


if __name__ == "__main__":
    unittest.main()
