from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.expense import Expense, ExtractionStatus, ReviewStatus
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_expense(db: Session, data: ExpenseCreate) -> Expense:
    expense = Expense(
        id=str(uuid4()),
        vendor=data.vendor,
        document_type=data.document_type,
        document_date=datetime(data.document_date.year, data.document_date.month, data.document_date.day, tzinfo=timezone.utc),
        document_number=data.document_number,
        currency=data.currency.strip().upper(),
        subtotal=data.subtotal,
        tax=data.tax,
        total=data.total,
        category=data.category,
        original_document_reference=data.original_document_reference,
        notes=data.notes,
        extraction_status=ExtractionStatus.manual,
        review_status=ReviewStatus.unreviewed,
        created_at=_now(),
        updated_at=_now(),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def get_expense(db: Session, expense_id: str) -> Optional[Expense]:
    return db.get(Expense, expense_id)


def list_expenses(db: Session, skip: int = 0, limit: int = 50) -> list[Expense]:
    stmt = select(Expense).order_by(Expense.created_at.desc())
    if skip:
        stmt = stmt.offset(skip)
    if limit:
        stmt = stmt.limit(limit)
    return db.execute(stmt).scalars().all()


def update_expense(db: Session, expense_id: str, data: ExpenseUpdate) -> Optional[Expense]:
    expense = db.get(Expense, expense_id)
    if not expense:
        return None
    update_data = data.model_dump(exclude_unset=True)
    if "document_date" in update_data and isinstance(update_data["document_date"], date := update_data["document_date"]):
        update_data["document_date"] = datetime(date.year, date.month, date.day, tzinfo=timezone.utc)
    for field, value in update_data.items():
        setattr(expense, field, value)
    expense.updated_at = _now()
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense_id: str) -> bool:
    expense = db.get(Expense, expense_id)
    if not expense:
        return False
    db.delete(expense)
    db.commit()
    return True


def count_expenses(db: Session) -> int:
    return db.execute(select(func.count(Expense.id))).scalar()
