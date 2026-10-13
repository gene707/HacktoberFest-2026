from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.expense import ExpenseCreate, ExpenseCreateClient, ExpenseUpdate, ExpenseRead, ExpenseList
from app.api.crud import create_expense, get_expense, list_expenses, update_expense, delete_expense, count_expenses

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("/create", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED, response_model_exclude_unset=True)
def create_expense_endpoint(payload: ExpenseCreateClient, db: Session = Depends(get_db)):
    expense = create_expense(db, payload)
    return expense


@router.get("", response_model=ExpenseList)
def list_expenses_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    items = list_expenses(db, skip=skip, limit=limit)
    return ExpenseList(items=[ExpenseRead.model_validate(item) for item in items], total=count_expenses(db))


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense_endpoint(expense_id: str, db: Session = Depends(get_db)):
    expense = get_expense(db, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=ExpenseRead)
def update_expense_endpoint(expense_id: str, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = update_expense(db, expense_id, payload)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_endpoint(expense_id: str, db: Session = Depends(get_db)):
    if not delete_expense(db, expense_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
