import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from us_job_finder_fetcher import run_us_job_finder


class USJobFinderFetcherTests(unittest.TestCase):
    def test_run_us_job_finder_normalizes_json_rows(self):
        payload = [
            {
                "title": "Software Engineer",
                "company": "ExampleCo",
                "location": "Remote - US",
                "source": "remotive",
                "url": "https://example.com/job",
                "date_posted": "2026-06-01T00:00:00+00:00",
                "salary": "$10",
                "description": "Python SQL APIs",
            }
        ]

        class Result:
            stdout = json.dumps(payload)

        with tempfile.NamedTemporaryFile() as handle, patch("subprocess.run", return_value=Result()) as mocked:
            frame = run_us_job_finder("software engineer", limit=1, tool_path=Path(handle.name))

        self.assertEqual(len(frame), 1)
        self.assertEqual(frame.loc[0, "company"], "ExampleCo")
        self.assertEqual(frame.loc[0, "role"], "Software Engineer")
        self.assertEqual(frame.loc[0, "application_link"], "https://example.com/job")
        self.assertIn("US Job Finder", frame.loc[0, "category"])
        mocked.assert_called_once()


if __name__ == "__main__":
    unittest.main()
