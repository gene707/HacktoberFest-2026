from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime, date
from decimal import Decimal
import re
from typing import Optional, List

from app.models.expense import ExtractionStatus, ReviewStatus


class ExpenseBase(BaseModel):
    vendor: str = Field(..., min_length=1, max_length=255)
    document_type: str = Field(..., min_length=1, max_length=64)
    document_date: date
    document_number: Optional[str] = Field(None, max_length=128)
    currency: str = Field(..., min_length=3, max_length=3)
    subtotal: Decimal = Field(..., ge=0)
    tax: Decimal = Field(..., ge=0)
    total: Decimal = Field(..., ge=0)
    category: str = Field(..., min_length=1, max_length=64)
    original_document_reference: Optional[str] = None
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    vendor: Optional[str] = Field(None, min_length=1, max_length=255)
    document_type: Optional[str] = Field(None, min_length=1, max_length=64)
    document_date: Optional[date] = None
    document_number: Optional[str] = Field(None, max_length=128)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    subtotal: Optional[Decimal] = Field(None, ge=0)
    tax: Optional[Decimal] = Field(None, ge=0)
    total: Optional[Decimal] = Field(None, ge=0)
    category: Optional[str] = Field(None, min_length=1, max_length=64)
    original_document_reference: Optional[str] = None
    notes: Optional[str] = None
    extraction_status: Optional[ExtractionStatus] = None
    review_status: Optional[ReviewStatus] = None
    model_config = ConfigDict(extra="forbid")


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    vendor: str
    document_type: str
    document_date: date
    document_number: Optional[str]
    currency: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    category: str
    original_document_reference: Optional[str]
    extraction_status: ExtractionStatus
    review_status: ReviewStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class ExpenseList(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    items: List[ExpenseRead]
    total: int


CURRENCY_PATTERN = re.compile(r"^[A-Za-z]{3}$")

class ExpenseCreateClient(ExpenseCreate):
    @field_validator("currency")
    @classmethod
    def currency_must_be_alpha(cls, v: str) -> str:
        v = str(v).strip().upper()
        if not CURRENCY_PATTERN.match(v):
            raise ValueError("currency must be a three-letter alphabetic code")
        return v

