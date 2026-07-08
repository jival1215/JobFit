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

    def test_records_prefer_ai_recommendation_fields(self):
        ranked = pd.DataFrame([
            {
                "job_id": "example|ai|https://example.com",
                "company": "Example",
                "role": "AI Intern",
                "location": "Remote",
                "source": "Summer internships",
                "match_score": 88,
                "recommendation": "Apply",
                "age": "1d",
                "application_link": "https://example.com",
                "matched_skills": "Python, LLM",
                "missing_skills": "AWS",
                "match_explanation": "Rule based explanation.",
                "tailoring_tips": "Rule based tip.",
                "ai_recommendations_provider": "Gemini",
                "ai_recommendations": '{"personalizedSummary":"Gemini summary.","matchExplanation":"Gemini explanation.","improvementTips":["Gemini tip."],"resumeKeywords":["LLM"],"suggestedExperience":["Highlight RAG project."],"resumeBulletChanges":[{"current":"Built LLM tool.","suggestion":"Tie it to the AI role.","reason":"It proves fit."}]}',
            }
        ])

        job = _records_from_ranked(ranked, "Built LLM tool.")[0]

        self.assertTrue(job["aiEnhanced"])
        self.assertEqual(job["aiProvider"], "Gemini")
        self.assertEqual(job["personalizedSummary"], "Gemini summary.")
        self.assertEqual(job["matchExplanation"], "Gemini explanation.")
        self.assertEqual(job["improvementTips"], ["Gemini tip."])
        self.assertEqual(job["resumeKeywords"], ["LLM"])
        self.assertEqual(job["suggestedExperience"], ["Highlight RAG project."])
        self.assertEqual(job["resumeBulletChanges"][0]["current"], "Built LLM tool.")


if __name__ == "__main__":
    unittest.main()
