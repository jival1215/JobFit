import unittest

import pandas as pd

from matcher import rank_jobs


class MatcherTests(unittest.TestCase):
    def test_ranking_orders_best_job_first(self):
        resume = "Python SQL pandas scikit-learn PostgreSQL Power BI machine learning dashboard data analytics"
        jobs = pd.DataFrame(
            [
                {
                    "company": "StrongMatch",
                    "role": "Data Analyst Intern",
                    "location": "Remote in USA",
                    "application_link": "https://example.com/1",
                    "age": "1d",
                    "category": "Data Science, AI & Machine Learning Internship Roles",
                },
                {
                    "company": "WeakMatch",
                    "role": "Embedded Hardware Intern",
                    "location": "Germany",
                    "application_link": "https://example.com/2",
                    "age": "2mo",
                    "category": "Hardware Engineering Internship Roles",
                },
            ]
        )
        ranked = rank_jobs(resume, jobs)
        self.assertEqual(ranked.loc[0, "company"], "StrongMatch")
        self.assertGreater(ranked.loc[0, "match_score"], ranked.loc[1, "match_score"])


if __name__ == "__main__":
    unittest.main()
