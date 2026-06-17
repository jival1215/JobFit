import tempfile
import unittest
from pathlib import Path

import pandas as pd

from job_scout import mark_new_jobs


class JobScoutTests(unittest.TestCase):
    def test_mark_new_jobs_flags_only_first_scan(self):
        jobs = pd.DataFrame([
            {"company": "A", "role": "Data Intern", "location": "Remote", "application_link": "https://x.test"}
        ])
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "seen.csv"
            first = mark_new_jobs(jobs, "Summer", path)
            second = mark_new_jobs(jobs, "Summer", path)
            self.assertTrue(bool(first.loc[0, "is_new"]))
            self.assertFalse(bool(second.loc[0, "is_new"]))


if __name__ == "__main__":
    unittest.main()
