"""FastAPI entrypoint shim for deployment hosts that auto-detect app.py.

The production API lives in backend/backend_api.py. Importing `app` here lets
Railway-style hosts use `app:app` while the code stays organized in the
backend package.
"""

from backend.backend_api import app

__all__ = ["app"]
