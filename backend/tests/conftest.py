import os
import tempfile
import shutil

import pytest
from fastapi.testclient import TestClient

# Use a file-based SQLite database for reliable cross-connection visibility
_db_dir = tempfile.mkdtemp()
_db_path = os.path.join(_db_dir, "test.db")
os.environ["LEDGERLEAF_DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["LEDGERLEAF_DOCUMENTS_DIR"] = tempfile.mkdtemp()
os.environ["LEDGERLEAF_SECRET_KEY"] = "test-secret"

from app.main import app
from app.database import engine, Base, get_db, SessionLocal
from sqlalchemy import text

# Create tables on the app's own engine (same one used by get_db unless overridden)
Base.metadata.create_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_db():
    # Clean data between tests but keep tables
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM expenses"))
        conn.commit()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    shutil.rmtree(_db_dir, ignore_errors=True)
