import os
import tempfile
import unittest
from pathlib import Path

try:
    from cryptography.fernet import Fernet
except ImportError:
    Fernet = None

import jobfit_db


class JobfitDbTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.original_path = jobfit_db.DB_PATH
        jobfit_db.DB_PATH = Path(self.tmp.name) / "jobfit_test.db"
        jobfit_db.init_db()

    def tearDown(self):
        jobfit_db.DB_PATH = self.original_path
        os.environ.pop("JOBFIT_ENCRYPTION_KEY", None)
        self.tmp.cleanup()

    def test_user_can_register_login_and_save_match(self):
        user = jobfit_db.create_user("student@example.com", "password123", "Jival", "Patel")
        self.assertEqual(user["email"], "student@example.com")
        self.assertEqual(user["displayName"], "Jival Patel")

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

    def test_session_tokens_are_hashed_at_rest(self):
        user = jobfit_db.create_user("tokens@example.com", "password123")
        token = jobfit_db.create_session(user["id"])

        with jobfit_db.db_connection() as conn:
            row = conn.execute("SELECT token FROM sessions LIMIT 1").fetchone()

        self.assertNotEqual(row["token"], token)
        self.assertEqual(jobfit_db.user_from_token(token)["email"], "tokens@example.com")

    def test_resume_record_is_saved_and_linked_to_match_run(self):
        user = jobfit_db.create_user("resume@example.com", "password123")
        resume = jobfit_db.save_resume_record(
            user["id"],
            "resume.pdf",
            "application/pdf",
            b"fake pdf bytes",
            "Python SQL machine learning resume text",
        )

        self.assertEqual(resume["filename"], "resume.pdf")
        self.assertFalse(resume["encrypted"])
        self.assertEqual(jobfit_db.user_summary(user["id"])["Resumes"], 1)

        stored = jobfit_db.get_resume_record(user["id"], resume["id"], include_text=True)
        self.assertEqual(stored["extractedText"], "Python SQL machine learning resume text")

        run_id = jobfit_db.save_match_run(
            user["id"],
            {
                "resumeId": resume["id"],
                "source": "Summer internships",
                "sourceUrl": "https://example.com/source",
                "fetchedAt": "2026-07-08T00:00:00+00:00",
                "count": 1,
                "newCount": 0,
                "aiRecommendationsEnabled": True,
                "jobs": [{"id": "job-1", "recommendation": "Apply"}],
            },
        )
        self.assertGreater(run_id, 0)
        self.assertEqual(jobfit_db.list_match_runs(user["id"])[0]["resumeId"], resume["id"])

    def test_resume_record_uses_encryption_key_when_configured(self):
        if Fernet is None:
            self.skipTest("cryptography is not installed in this Python environment")
        os.environ["JOBFIT_ENCRYPTION_KEY"] = Fernet.generate_key().decode("utf-8")
        user = jobfit_db.create_user("secure@example.com", "password123")
        resume = jobfit_db.save_resume_record(
            user["id"],
            "secure.txt",
            "text/plain",
            b"resume bytes",
            "private resume text",
        )

        self.assertTrue(resume["encrypted"])
        stored = jobfit_db.get_resume_record(user["id"], resume["id"], include_text=True)
        self.assertEqual(stored["extractedText"], "private resume text")

    def test_job_cache_round_trips_source_jobs(self):
        cached = jobfit_db.save_job_cache(
            "Jobright data new grad",
            "https://example.com/jobs.md",
            "2026-07-15T00:00:00+00:00",
            [{"company": "Example", "role": "Data Analyst", "location": "Remote", "application_link": "https://example.com/apply", "age": "Jul 15", "category": "Data", "source": "Jobright data new grad"}],
        )
        self.assertEqual(cached["jobCount"], 1)
        loaded = jobfit_db.get_job_cache("Jobright data new grad")
        self.assertEqual(loaded["jobs"][0]["company"], "Example")
        self.assertEqual(jobfit_db.job_cache_summary()[0]["jobCount"], 1)


if __name__ == "__main__":
    unittest.main()
