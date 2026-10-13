import { useId, useState, useCallback } from "react";
import type { ExpenseCreateVariables, ExpenseUpdateVariables } from "../types/expenses";

const DOCUMENT_TYPES = ["invoice", "receipt", "statement", "credit note", "other"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "BRL"];
const CATEGORIES = [
  "Office Supplies",
  "Software & Subscriptions",
  "Travel",
  "Meals & Entertainment",
  "Utilities",
  "Rent & Lease",
  "Professional Services",
  "Equipment",
  "Inventory",
  "Marketing",
  "Insurance",
  "Taxes & Fees",
  "Bank Charges",
  "Other",
];

interface FieldProps {
  id: string;
  label: string;
  name: string;
  type?: "text" | "date" | "select";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  list?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  children?: React.ReactNode;
  dataTestId?: string;
}

function Field({ id, label, name, type = "text", value, onChange, error, required, autoComplete, min, max, disabled, list, inputMode, children, dataTestId }: FieldProps) {
  const describedBy = error ? ` ${id}-error` : "";
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="field-required" aria-hidden="true"> *</span>}
      </label>
      {type === "select" ? (
        <select
          id={id}
          name={name}
          className="field-input field-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy ? id + "-error" : undefined}
          data-testid={dataTestId ?? undefined}
        >
          <option value="">— Select —</option>
          {children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          name={name}
          className="field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          disabled={disabled}
          list={list}
          inputMode={inputMode ?? undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy ? id + "-error" : undefined}
          data-testid={dataTestId ?? undefined}
        />
      )}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

interface ExpenseFormProps {
  mode: "create" | "edit";
  initial?: Partial<ExpenseUpdateVariables>;
  onSubmit: (variables: ExpenseCreateVariables | ExpenseUpdateVariables) => Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  submitLabel?: string;
}

export function ExpenseForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  saving = false,
  submitLabel,
}: ExpenseFormProps) {
  const vendorId = useId();
  const docTypeId = useId();
  const docDateId = useId();
  const docNumId = useId();
  const currencyId = useId();
  const subtotalId = useId();
  const taxId = useId();
  const totalId = useId();
  const categoryId = useId();
  const origRefId = useId();
  const notesId = useId();

  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [documentType, setDocumentType] = useState(initial?.documentType ?? "");
  const [documentDate, setDocumentDate] = useState(initial?.documentDate ?? "");
  const [documentNumber, setDocumentNumber] = useState(initial?.documentNumber ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "");
  const [subtotal, setSubtotal] = useState(initial?.subtotal ?? "");
  const [tax, setTax] = useState(initial?.tax ?? "");
  const [total, setTotal] = useState(initial?.total ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [originalDocumentReference, setOriginalDocumentReference] = useState(initial?.originalDocumentReference ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!vendor.trim()) next[vendorId] = "Vendor is required.";
    if (!documentType) next[docTypeId] = "Document type is required.";
    if (!documentDate) next[docDateId] = "Document date is required.";
    else if (isNaN(Date.parse(documentDate))) next[docDateId] = "Enter a valid date.";
    if (!currency) next[currencyId] = "Currency is required.";
    else if (!/^[A-Za-z]{3}$/.test(currency)) next[currencyId] = "Use a 3-letter currency code.";
    if (!subtotal) next[subtotalId] = "Subtotal is required.";
    else if (!/^(0|[1-9]\d*)(\.\d{1,4})?$/.test(subtotal)) next[subtotalId] = "Enter a valid amount.";
    if (!tax) next[taxId] = "Tax is required.";
    else if (!/^(0|[1-9]\d*)(\.\d{1,4})?$/.test(tax)) next[taxId] = "Enter a valid amount.";
    if (!total) next[totalId] = "Total is required.";
    else if (!/^(0|[1-9]\d*)(\.\d{1,4})?$/.test(total)) next[totalId] = "Enter a valid amount.";
    if (!category) next[categoryId] = "Category is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [vendor, documentType, documentDate, currency, subtotal, tax, total, category, vendorId, docTypeId, docDateId, currencyId, subtotalId, taxId, totalId, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      vendor: vendor.trim(),
      documentType,
      documentDate,
      documentNumber: documentNumber.trim() || undefined,
      currency: currency.toUpperCase(),
      subtotal,
      tax,
      total,
      category,
      originalDocumentReference: originalDocumentReference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit} noValidate data-testid="expense-form">
      <div className="field-grid">
        <Field
          id={vendorId}
          dataTestId="vendor"
          label="Vendor"
          name="vendor"
          value={vendor}
          onChange={setVendor}
          error={errors[vendorId]}
          required
          autoComplete="organization"
          list="vendor-suggestions"
        />
        <Field
          id={docTypeId}
          dataTestId="documentType"
          label="Document type"
          name="documentType"
          type="select"
          value={documentType}
          onChange={setDocumentType}
          error={errors[docTypeId]}
          required
        >
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Field>
        <Field
          id={docDateId}
          dataTestId="documentDate"
          label="Document date"
          name="documentDate"
          type="date"
          value={documentDate}
          onChange={setDocumentDate}
          error={errors[docDateId]}
          required
        />
        <Field
          id={docNumId}
          dataTestId="documentNumber"
          label="Document number"
          name="documentNumber"
          value={documentNumber}
          onChange={setDocumentNumber}
          autoComplete="off"
        />
        <Field
          id={currencyId}
          dataTestId="currency"
          label="Currency"
          name="currency"
          type="select"
          value={currency}
          onChange={setCurrency}
          error={errors[currencyId]}
          required
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Field>
        <Field
          id={subtotalId}
          dataTestId="subtotal"
          label="Subtotal"
          name="subtotal"
          type="text"
          inputMode="decimal"
          value={subtotal}
          onChange={setSubtotal}
          error={errors[subtotalId]}
          required
        />
        <Field
          id={taxId}
          dataTestId="tax"
          label="Tax"
          name="tax"
          type="text"
          inputMode="decimal"
          value={tax}
          onChange={setTax}
          error={errors[taxId]}
          required
        />
        <Field
          id={totalId}
          dataTestId="total"
          label="Total"
          name="total"
          type="text"
          inputMode="decimal"
          value={total}
          onChange={setTotal}
          error={errors[totalId]}
          required
        />
        <Field
          id={categoryId}
          dataTestId="category"
          label="Category"
          name="category"
          type="select"
          value={category}
          onChange={setCategory}
          error={errors[categoryId]}
          required
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Field>
        <Field
          id={origRefId}
          dataTestId="originalDocumentReference"
          label="Original document reference"
          name="originalDocumentReference"
          value={originalDocumentReference}
          onChange={setOriginalDocumentReference}
          autoComplete="off"
        />
        <div className="field full-width">
          <label htmlFor={notesId} className="field-label">Notes</label>
          <textarea
            id={notesId}
            name="notes"
            className="field-input field-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel ?? (mode === "create" ? "Create expense" : "Save changes")}
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="form-summary-error" role="status">
          Please fix the highlighted fields.
        </p>
      )}
    </form>
  );
}
