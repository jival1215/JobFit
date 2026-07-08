import tempfile
import unittest
from pathlib import Path

import jobfit_db


class JobfitDbTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.original_path = jobfit_db.DB_PATH
        jobfit_db.DB_PATH = Path(self.tmp.name) / "jobfit_test.db"
        jobfit_db.init_db()

    def tearDown(self):
        jobfit_db.DB_PATH = self.original_path
        self.tmp.cleanup()

    def test_user_can_register_login_and_save_match(self):
        user = jobfit_db.create_user("student@example.com", "password123")
        self.assertEqual(user["email"], "student@example.com")

        authenticated = jobfit_db.authenticate_user("student@example.com", "password123")
        self.assertIsNotNone(authenticated)
        token = jobfit_db.create_session(user["id"])
        self.assertEqual(jobfit_db.user_from_token(token)["email"], "student@example.com")

        job = {
            "id": "job-1",
            "company": "Example",
            "title": "Data Analyst Intern",
            "location": "Remote",
            "applyUrl": "https://example.com/apply",
            "source": "Summer internships",
            "posted": "1d",
            "matchScore": 88,
        }
        jobfit_db.save_user_match(user["id"], job, "Saved")
        saved = jobfit_db.list_saved_matches(user["id"])
        self.assertEqual(saved[0]["company"], "Example")
        self.assertEqual(saved[0]["status"], "Saved")
        self.assertEqual(jobfit_db.user_summary(user["id"])["Saved"], 1)

    def test_match_run_is_saved_for_user(self):
        user = jobfit_db.create_user("run@example.com", "password123")
        run_id = jobfit_db.save_match_run(
            user["id"],
            {
                "source": "Summer internships",
                "sourceUrl": "https://example.com/source",
                "fetchedAt": "2026-07-08T00:00:00+00:00",
                "count": 2,
                "newCount": 1,
                "aiRecommendationsEnabled": True,
                "jobs": [{"id": "job-1"}],
            },
        )
        self.assertGreater(run_id, 0)
        runs = jobfit_db.list_match_runs(user["id"])
        self.assertEqual(runs[0]["count"], 2)
        self.assertTrue(runs[0]["aiEnabled"])


if __name__ == "__main__":
    unittest.main()
