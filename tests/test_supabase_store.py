import os
import unittest
from unittest.mock import Mock, patch

import backend.supabase_store as supabase_store


class SupabaseStoreTests(unittest.TestCase):
    def setUp(self):
        os.environ["SUPABASE_URL"] = "https://example.supabase.co"
        os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "service-role-key"

    def tearDown(self):
        os.environ.pop("SUPABASE_URL", None)
        os.environ.pop("SUPABASE_SERVICE_ROLE_KEY", None)
        os.environ.pop("SUPABASE_TABLE_PREFIX", None)

    def _response(self, payload, status=200):
        response = Mock()
        response.status_code = status
        response.text = "[]" if payload is None else "json"
        response.json.return_value = payload if payload is not None else []
        return response

    @patch("backend.supabase_store.requests.request")
    def test_create_user_uses_prefixed_supabase_tables(self, request):
        request.side_effect = [
            self._response([]),
            self._response([{"id": 7, "email": "student@example.com", "first_name": "Jival", "last_name": "Patel", "created_at": "2026-07-10T00:00:00+00:00"}]),
        ]

        user = supabase_store.create_user("Student@Example.com", "password123", "Jival", "Patel")

        self.assertEqual(user["id"], 7)
        self.assertEqual(user["email"], "student@example.com")
        self.assertEqual(user["displayName"], "Jival Patel")
        self.assertIn("/rest/v1/jobfit_users", request.call_args_list[0].args[1])
        self.assertEqual(request.call_args_list[1].kwargs["json"]["first_name"], "Jival")
        self.assertEqual(request.call_args_list[1].kwargs["json"]["last_name"], "Patel")
        self.assertEqual(request.call_args_list[1].kwargs["headers"]["Prefer"], "return=representation")

    @patch("backend.supabase_store.requests.request")
    def test_save_match_run_stores_recommendation_payload(self, request):
        request.return_value = self._response([{"id": 42}])

        run_id = supabase_store.save_match_run(
            7,
            {
                "resumeId": 3,
                "source": "Summer internships",
                "sourceUrl": "https://example.com/jobs.md",
                "fetchedAt": "2026-07-10T00:00:00+00:00",
                "count": 1,
                "newCount": 1,
                "aiRecommendationsEnabled": True,
                "jobs": [{"id": "job-1", "recommendation": "Apply"}],
            },
        )

        self.assertEqual(run_id, 42)
        payload = request.call_args.kwargs["json"]
        self.assertEqual(payload["resume_id"], 3)
        self.assertEqual(payload["jobs_json"][0]["recommendation"], "Apply")
        self.assertTrue(payload["ai_enabled"])

    @patch("backend.supabase_store.requests.get")
    @patch("backend.supabase_store.requests.request")
    def test_supabase_auth_token_maps_to_jobfit_user(self, mocked_request, mocked_get):
        class AuthResponse:
            status_code = 200

            def json(self):
                return {"id": "auth-user-1", "email": "student@example.com", "user_metadata": {"first_name": "Jival", "last_name": "Patel"}}

        mocked_get.return_value = AuthResponse()
        mocked_request.side_effect = [
            Mock(status_code=200, text="[]", json=lambda: []),
            Mock(status_code=201, text='[{"id":7,"email":"student@example.com","first_name":"Jival","last_name":"Patel","created_at":"now"}]', json=lambda: [{"id": 7, "email": "student@example.com", "first_name": "Jival", "last_name": "Patel", "created_at": "now"}]),
        ]

        user = supabase_store.user_from_token("supabase-access-token")

        self.assertEqual(user["email"], "student@example.com")
        self.assertEqual(user["displayName"], "Jival Patel")
        self.assertEqual(user["authProvider"], "supabase")

    @patch("backend.supabase_store.requests.request")
    def test_job_cache_is_saved_to_supabase(self, request):
        request.return_value = self._response([])

        result = supabase_store.save_job_cache(
            "Jobright software new grad",
            "https://example.com/jobs.md",
            "2026-07-15T00:00:00+00:00",
            [{"company": "Example", "role": "Software Engineer"}],
        )

        self.assertEqual(result["jobCount"], 1)
        self.assertIn("/rest/v1/jobfit_job_cache", request.call_args_list[0].args[1])
        payload = request.call_args_list[1].kwargs["json"]
        self.assertEqual(payload["source_name"], "Jobright software new grad")
        self.assertEqual(payload["jobs_json"][0]["company"], "Example")


if __name__ == "__main__":
    unittest.main()
