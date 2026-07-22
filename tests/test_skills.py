import unittest

from backend.skills import extract_skills


class SkillTests(unittest.TestCase):
    def test_skill_aliases_are_normalized(self):
        text = "Built ML tools with sklearn, JS, postgres, and gen ai workflows."
        skills = extract_skills(text)
        self.assertIn("machine learning", skills)
        self.assertIn("scikit-learn", skills)
        self.assertIn("javascript", skills)
        self.assertIn("postgresql", skills)
        self.assertIn("generative ai", skills)


if __name__ == "__main__":
    unittest.main()
