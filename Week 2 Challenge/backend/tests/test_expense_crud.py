import pytest
from decimal import Decimal
from datetime import date, datetime, timezone

from app.models.expense import Expense, ExtractionStatus, ReviewStatus
from app.database import Base

BASE = "/api/v1/expenses"


def test_create_and_retrieve_expense(client):
    payload = {
        "vendor": "Acme Office Supplies",
        "document_type": "invoice",
        "document_date": "2025-09-14",
        "document_number": "INV-1001",
        "currency": "usd",
        "subtotal": "120.00",
        "tax": "12.00",
        "total": "132.00",
        "category": "Office Supplies",
        "notes": "Q3 office supplies",
    }
    r = client.post(f"{BASE}/create", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["vendor"] == "Acme Office Supplies"
    assert data["id"] is not None
    assert data["currency"] == "USD"
    assert data["extraction_status"] == "manual"
    assert data["review_status"] == "unreviewed"

    # Retrieve
    r2 = client.get(f"{BASE}/{data['id']}")
    assert r2.status_code == 200
    assert r2.json()["vendor"] == "Acme Office Supplies"


def test_update_expense(client):
    r = client.post(f"{BASE}/create", json={
        "vendor": "Old Vendor",
        "document_type": "receipt",
        "document_date": "2025-01-10",
        "currency": "eur",
        "subtotal": "50.00",
        "tax": "5.00",
        "total": "55.00",
        "category": "Supplies",
    })
    eid = r.json()["id"]

    update = {"vendor": "New Vendor", "notes": "Updated notes"}
    r2 = client.patch(f"{BASE}/{eid}", json=update)
    assert r2.status_code == 200
    data = r2.json()
    assert data["vendor"] == "New Vendor"
    assert data["notes"] == "Updated notes"
    assert data["currency"] == "EUR"  # unchanged, still uppercased


def test_delete_expense(client):
    r = client.post(f"{BASE}/create", json={
        "vendor": "Delete Me",
        "document_type": "invoice",
        "document_date": "2025-03-03",
        "currency": "gbp",
        "subtotal": "10.00",
        "tax": "1.00",
        "total": "11.00",
        "category": "Misc",
    })
    eid = r.json()["id"]
    r2 = client.delete(f"{BASE}/{eid}")
    assert r2.status_code == 204
    r3 = client.get(f"{BASE}/{eid}")
    assert r3.status_code == 404


def test_missing_required_fields_rejected(client):
    r = client.post(f"{BASE}/create", json={})
    assert r.status_code == 422
    data = r.json()
    assert data["detail"] == "Validation failed"
    assert len(data["errors"]) > 0


def test_invalid_date_rejected(client):
    r = client.post(f"{BASE}/create", json={
        "vendor": "V",
        "document_type": "inv",
        "document_date": "not-a-date",
        "currency": "usd",
        "subtotal": "10",
        "tax": "1",
        "total": "11",
        "category": "Cats",
    })
    assert r.status_code == 422


def test_invalid_currency_rejected(client):
    r = client.post(f"{BASE}/create", json={
        "vendor": "V",
        "document_type": "inv",
        "document_date": "2025-01-01",
        "currency": "XYZA",
        "subtotal": "10",
        "tax": "1",
        "total": "11",
        "category": "Cats",
    })
    assert r.status_code == 422


def test_decimal_roundtrip_no_precision_loss(client):
    payload = {
        "vendor": "Precision Test",
        "document_type": "invoice",
        "document_date": "2025-07-07",
        "currency": "usd",
        "subtotal": "999999999.9999",
        "tax": "0.0001",
        "total": "1000000000.0000",
        "category": "Precision",
    }
    r = client.post(f"{BASE}/create", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert Decimal(data["subtotal"]) == Decimal("999999999.9999")
    assert Decimal(data["tax"]) == Decimal("0.0001")
    assert Decimal(data["total"]) == Decimal("1000000000.0000")


def test_list_expenses(client):
    for i in range(3):
        client.post(f"{BASE}/create", json={
            "vendor": f"V{i}",
            "document_type": "receipt",
            "document_date": "2025-01-01",
            "currency": "usd",
            "subtotal": "10",
            "tax": "1",
            "total": "11",
            "category": "Test",
        })
    r = client.get(f"{BASE}")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3
    assert data["items"][0]["vendor"] == "V2"


def test_database_persists_across_restarts(tmp_path):
    """Expense records persist across application restarts (file-based SQLite)."""
    import uuid
    persist_db = tmp_path / "persist.db"
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    eng = create_engine(f"sqlite:///{persist_db}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    Session = sessionmaker(bind=eng)

    session = Session()
    eid = str(uuid.uuid4())
    expense = Expense(
        id=eid,
        vendor="Persistent Vendor",
        document_type="invoice",
        document_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
        currency="USD",
        subtotal=Decimal("99.99"),
        tax=Decimal("9.99"),
        total=Decimal("109.98"),
        category="Persistence",
        extraction_status=ExtractionStatus.manual,
        review_status=ReviewStatus.unreviewed,
        created_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
    )
    session.add(expense)
    session.commit()
    session.close()

    # Simulate a restart: new session reads the persisted row
    session2 = Session()
    found = session2.get(Expense, eid)
    assert found is not None
    assert found.vendor == "Persistent Vendor"
    assert Decimal(found.subtotal) == Decimal("99.99")
    session2.close()
