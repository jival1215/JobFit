import json
import os
import unittest
from unittest.mock import patch

import pandas as pd

from gemini_recommender import enrich_ranked_with_gemini, gemini_enabled, get_gemini_recommendations


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

    @patch("gemini_recommender.requests.post")
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


if __name__ == "__main__":
    unittest.main()
