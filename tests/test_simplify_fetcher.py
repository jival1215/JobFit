import unittest

from simplify_fetcher import parse_simplify_jobs


class SimplifyFetcherTests(unittest.TestCase):
    def test_parse_simplify_html_table_with_category_and_continuation_company(self):
        markdown = """
## 🤖 Data Science, AI & Machine Learning Internship Roles
<table>
<tr><th>Company</th><th>Role</th><th>Location</th><th>Application</th><th>Age</th></tr>
<tr>
<td><strong><a href="https://simplify.jobs/c/Test">TestCo</a></strong></td>
<td>Data Analyst Intern</td>
<td>Remote in USA</td>
<td><a href="https://example.com/apply">Apply</a> <a href="https://simplify.jobs/p/abc">Simplify</a></td>
<td>1d</td>
</tr>
<tr>
<td>↳</td>
<td>Data Engineer Intern</td>
<td>NYC</td>
<td><a href="https://example.com/apply2">Apply</a></td>
<td>2d</td>
</tr>
</table>
"""
        jobs = parse_simplify_jobs(markdown)
        self.assertEqual(len(jobs), 2)
        self.assertEqual(jobs.loc[0, "company"], "TestCo")
        self.assertEqual(jobs.loc[1, "company"], "TestCo")
        self.assertEqual(jobs.loc[0, "application_link"], "https://example.com/apply")
        self.assertIn("Data Science", jobs.loc[0, "category"])

    def test_parse_simplify_uses_simplify_apply_link_as_fallback(self):
        markdown = """
## Software Engineering Internship Roles
<table>
<tr><th>Company</th><th>Role</th><th>Location</th><th>Application</th><th>Age</th></tr>
<tr>
<td>The Campbell's Company</td>
<td>Agentic AI Engineer Co-op</td>
<td>Camden, NJ</td>
<td><a href="https://simplify.jobs/p/campbells-agentic-ai">Apply</a></td>
<td>1mo</td>
</tr>
</table>
"""
        jobs = parse_simplify_jobs(markdown)
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs.loc[0, "application_link"], "https://simplify.jobs/p/campbells-agentic-ai")


if __name__ == "__main__":
    unittest.main()
