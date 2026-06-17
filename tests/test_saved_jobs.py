import tempfile
import unittest
from pathlib import Path

from saved_jobs import load_statuses, save_job_status, tracker_summary


class SavedJobsTests(unittest.TestCase):
    def test_save_job_status_tracks_notes_and_dates(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "saved.csv"
            job = {"company": "A", "role": "Data Intern", "location": "Remote", "application_link": "https://x.test"}
            save_job_status(job, "Applied", "sent resume", "2026-06-16", "2026-06-23", path)
            rows = load_statuses(path)
            self.assertEqual(rows.loc[0, "notes"], "sent resume")
            self.assertEqual(rows.loc[0, "applied_date"], "2026-06-16")
            self.assertEqual(tracker_summary(rows)["Applied"], 1)


if __name__ == "__main__":
    unittest.main()
