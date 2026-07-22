import json
import os
import unittest
from unittest.mock import patch

import pandas as pd

from backend.gemini_recommender import enrich_ranked_with_gemini, gemini_enabled, get_gemini_recommendations, rerank_top_matches_with_recruiter_agent


class GeminiRecommenderTests(unittest.TestCase):
    def setUp(self):
        self.env_patch = patch.dict(os.environ, {}, clear=False)
        self.env_patch.start()
        os.environ.pop("GEMINI_API_KEY", None)
        os.environ.pop("ENABLE_GEMINI_RECOMMENDATIONS", None)

    def tearDown(self):
        self.env_patch.stop()

    def test_gemini_disabled_without_key(self):
        os.environ["ENABLE_GEMINI_RECOMMENDATIONS"] = "true"
        self.assertFalse(gemini_enabled())

    def test_enrich_noops_when_disabled(self):
        ranked = pd.DataFrame([
            {
                "company": "Example",
                "role": "Data Analyst Intern",
                "location": "Remote",
                "match_score": 90,
            }
        ])
        enriched = enrich_ranked_with_gemini(ranked, "Python SQL resume", limit=1)
        self.assertNotIn("ai_recommendations", enriched.columns)

    @patch("backend.gemini_recommender.requests.post")
    def test_get_gemini_recommendations_parses_json(self, mocked_post):
        os.environ["GEMINI_API_KEY"] = "test-key"

        class Response:
            def raise_for_status(self):
                return None

            def json(self):
                return {
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {
                                        "text": json.dumps(
                                            {
                                                "personalizedSummary": "Strong analytics fit.",
                                                "matchExplanation": "Your Python and SQL work maps well to this role.",
                                                "improvementTips": ["Lead with dashboard impact."],
                                                "resumeKeywords": ["SQL", "dashboards"],
                                                "suggestedExperience": ["Highlight RiskLens."],
                                                "resumeBulletChanges": [
                                                    {
                                                        "current": "Built a Python SQL dashboard.",
                                                        "suggestion": "Tie this dashboard to the data analyst role.",
                                                        "reason": "It proves the core analytics work.",
                                                    }
                                                ],
                                            }
                                        )
                                    }
                                ]
                            }
                        }
                    ]
                }

        mocked_post.return_value = Response()
        row = pd.Series(
            {
                "company": "Example",
                "role": "Data Analyst Intern",
                "location": "Remote",
                "match_score": 90,
                "matched_skills": "Python, SQL",
                "missing_skills": "Tableau",
            }
        )

        recommendations = get_gemini_recommendations(row, "Built a Python SQL dashboard.")

        self.assertEqual(recommendations["personalizedSummary"], "Strong analytics fit.")
        self.assertEqual(recommendations["resumeKeywords"], ["SQL", "dashboards"])
        self.assertEqual(recommendations["resumeBulletChanges"][0]["current"], "Built a Python SQL dashboard.")

    @patch("backend.gemini_recommender.time.sleep", return_value=None)
    @patch("backend.gemini_recommender.requests.post")
    def test_gemini_retries_transient_timeout(self, mocked_post, _mocked_sleep):
        os.environ["GEMINI_API_KEY"] = "test-key"

        class Response:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {"candidates": [{"content": {"parts": [{"text": json.dumps({"personalizedSummary": "Good fit", "matchExplanation": "Python SQL fit", "improvementTips": [], "resumeKeywords": [], "suggestedExperience": [], "resumeBulletChanges": []})}]}}]}

        import requests
        mocked_post.side_effect = [requests.Timeout("slow"), Response()]
        row = pd.Series({"company": "Example", "role": "Data Analyst", "location": "Remote", "match_score": 80})
        result = get_gemini_recommendations(row, "Built Python SQL dashboard.")
        self.assertEqual(result["personalizedSummary"], "Good fit")
        self.assertEqual(mocked_post.call_count, 2)

    @patch("backend.gemini_recommender.requests.post")
    def test_gemini_malformed_json_raises_for_fallback_handling(self, mocked_post):
        os.environ["GEMINI_API_KEY"] = "test-key"

        class Response:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {"candidates": [{"content": {"parts": [{"text": "not json"}]}}]}

        mocked_post.return_value = Response()
        row = pd.Series({"company": "Example", "role": "Data Analyst", "location": "Remote", "match_score": 80})
        with self.assertRaises(ValueError):
            get_gemini_recommendations(row, "Built Python SQL dashboard.")

    @patch("backend.gemini_recommender.get_recruiter_relatedness")
    def test_recruiter_agent_reviews_next_candidate_when_it_can_enter_top_10(self, mocked_relatedness):
        os.environ["ENABLE_GEMINI_RECOMMENDATIONS"] = "true"
        os.environ["GEMINI_API_KEY"] = "test-key"
        rows = []
        for index in range(11):
            rows.append(
                {
                    "company": f"Company {index}",
                    "role": f"AI Data Intern {index}",
                    "location": "Remote",
                    "match_score": 95 - index,
                    "recommendation": "Apply",
                    "matched_skills": "Python, SQL",
                    "missing_skills": "AWS",
                }
            )
        ranked = pd.DataFrame(rows)

        def score_for(row, resume_text):
            company = str(row.get("company", ""))
            score = 100 if company == "Company 10" else 70
            return {
                "recruiterRelatednessScore": score,
                "recruiterRelatednessReasoning": f"Score {score}",
                "recruiterRelatedEvidence": ["Python"],
                "recruiterRelatedConcerns": [],
            }

        mocked_relatedness.side_effect = score_for
        reranked = rerank_top_matches_with_recruiter_agent(
            ranked,
            "Python SQL AI resume",
            target_size=10,
            batch_size=10,
            max_candidates=11,
            ai_weight=0.20,
        )

        self.assertIn("Company 10", set(reranked.head(10)["company"]))
        self.assertEqual(float(reranked.loc[reranked["company"] == "Company 10", "ai_recruiter_relatedness_score"].iloc[0]), 100.0)


if __name__ == "__main__":
    unittest.main()
