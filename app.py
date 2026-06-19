"""FastAPI entrypoint for deployment hosts that auto-detect app.py.

The legacy Streamlit UI lives in streamlit_app.py. The production API lives
in backend_api.py, and this module exposes its top-level FastAPI app for
platforms that expect `app:app`.
"""

from backend_api import app

__all__ = ["app"]
