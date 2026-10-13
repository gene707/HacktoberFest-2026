import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("LEDGERLEAF_SECRET_KEY", "change-me-in-production")
APP_ORIGIN = os.getenv("LEDGERLEAF_APP_ORIGIN", "http://localhost:5173")

DATABASE_URL = os.getenv("LEDGERLEAF_DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'ledgerleaf.db'}")

DOCUMENTS_DIR = os.getenv("LEDGERLEAF_DOCUMENTS_DIR", str(BASE_DIR / "documents"))

API_PREFIX = "/api/v1"
