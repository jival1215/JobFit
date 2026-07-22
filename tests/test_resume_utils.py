import os
import unittest
from unittest.mock import patch

from backend.resume_utils import parse_resume_structure, validate_resume_upload


class ResumeUtilsHardeningTests(unittest.TestCase):
    def tearDown(self):
        os.environ.pop("JOBFIT_MAX_RESUME_BYTES", None)

    def test_rejects_unsupported_resume_type(self):
        with self.assertRaises(ValueError):
            validate_resume_upload("resume.exe", b"not a resume")

    def test_rejects_oversized_resume(self):
        os.environ["JOBFIT_MAX_RESUME_BYTES"] = "262144"
        with self.assertRaises(OverflowError):
            validate_resume_upload("resume.txt", b"x" * 300000)

    def test_parses_structured_resume_data(self):
        structured = parse_resume_structure("""
Education
Rutgers University Computer Science
Projects
Built RiskLens dashboard with Python SQL and FastAPI
Skills
Python, SQL, React, FastAPI
Built a machine learning dashboard with Python and SQL for analyst review workflows.
""")
        self.assertIn("Rutgers University Computer Science", structured["education"])
        self.assertTrue(structured["projects"])
        self.assertTrue(structured["experienceBullets"])
        self.assertIn("python", structured["keywords"])


if __name__ == "__main__":
    unittest.main()
