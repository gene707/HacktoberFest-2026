import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { listExpenses, createExpense, getExpense, updateExpense, deleteExpense } from "../api/client";
import {
  EmptyState,
  LoadingSpinner,
  APIErrorBanner,
  ExpenseForm,
  ConfirmDialog,
} from "../components";
import type { Expense, ExpenseCreateVariables, ExpenseUpdateVariables } from "../types/expenses";

const PAGE_SIZE = 20;

export function ExpensesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const isNew = location.pathname.endsWith("/new");
  const isDetailOrEdit = id !== undefined && !isNew;

  const [items, setItems] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listExpenses(p * PAGE_SIZE, PAGE_SIZE);
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(0); return () => { /* noop */ }; }, [fetchList]);

  const refresh = useCallback(() => fetchList(0), [fetchList]);

  const handleCreate = async (variables: ExpenseCreateVariables | ExpenseUpdateVariables) => {
    setSaving(true);
    setError(null);
    try {
      const created = await createExpense(variables as ExpenseCreateVariables);
      refresh();
      navigate(`/expenses/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (variables: ExpenseUpdateVariables) => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updateExpense(id, variables);
      refresh();
      navigate(`/expenses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (expense: Expense) => setDeleteTarget(expense);
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget.id);
      refresh();
      navigate("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (isNew) {
    return (
      <div className="page">
        <h1 className="page-title">New expense</h1>
        {error && <APIErrorBanner error={error} onRetry={refresh} />}
        <ExpenseForm mode="create" onSubmit={handleCreate} onCancel={() => navigate("/expenses")} saving={saving} />
      </div>
    );
  }

  if (isDetailOrEdit) {
    const [record, setRecord] = useState<Expense | null>(null);
    const [editing, setEditing] = useState(false);
    const [recordLoading, setRecordLoading] = useState(true);
    const [recordError, setRecordError] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      const run = async () => {
        try {
          const data = await getExpense(id!);
          if (!cancelled) setRecord(data);
        } catch (err) {
          if (!cancelled) setRecordError(err instanceof Error ? err.message : "Expense not found.");
        } finally {
          if (!cancelled) setRecordLoading(false);
        }
      };
      run();
      return () => { cancelled = true; };
    }, [id]);

    if (recordLoading) return <LoadingSpinner label="Loading expense…" />;
    if (recordError) return <APIErrorBanner error={recordError} onRetry={() => window.location.reload()} />;
    if (!record) return null;

    return (
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">Expense</h1>
          <div className="page-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="btn btn-danger-outline" onClick={() => confirmDelete(record)}>
              Delete
            </button>
          </div>
        </div>

        {editing ? (
          <ExpenseForm
            mode="edit"
            initial={{
              vendor: record.vendor,
              documentType: record.documentType,
              documentDate: record.documentDate,
              documentNumber: record.documentNumber ?? "",
              currency: record.currency,
              subtotal: record.subtotal,
              tax: record.tax,
              total: record.total,
              category: record.category,
              originalDocumentReference: record.originalDocumentReference ?? "",
              notes: record.notes ?? "",
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditing(false)}
            saving={saving}
            submitLabel="Update expense"
          />
        ) : (
          <article className="expense-detail">
            <section className="detail-section">
              <h2 className="detail-heading">Document</h2>
              <dl className="detail-grid">
                <dt>Vendor</dt><dd>{record.vendor}</dd>
                <dt>Document type</dt><dd>{record.documentType}</dd>
                <dt>Document date</dt><dd>{record.documentDate}</dd>
                <dt>Document number</dt><dd>{record.documentNumber ?? "—"}</dd>
                <dt>Currency</dt><dd>{record.currency}</dd>
                <dt>Category</dt><dd>{record.category}</dd>
              </dl>
            </section>

            <section className="detail-section">
              <h2 className="detail-heading">Amounts</h2>
              <dl className="detail-grid detail-amounts">
                <dt>Subtotal</dt><dd>{record.subtotal} {record.currency}</dd>
                <dt>Tax</dt><dd>{record.tax} {record.currency}</dd>
                <dt>Total</dt><dd><strong>{record.total} {record.currency}</strong></dd>
              </dl>
            </section>

            {record.originalDocumentReference && (
              <section className="detail-section">
                <h2 className="detail-heading">Original document</h2>
                <p>{record.originalDocumentReference}</p>
              </section>
            )}

            {record.notes && (
              <section className="detail-section">
                <h2 className="detail-heading">Notes</h2>
                <p>{record.notes}</p>
              </section>
            )}

            <section className="detail-section">
              <h2 className="detail-heading">Status</h2>
              <dl className="detail-grid">
                <dt>Extraction</dt><dd className="status-pill">{record.extractionStatus}</dd>
                <dt>Review</dt><dd className="status-pill">{record.reviewStatus}</dd>
              </dl>
            </section>

            <section className="detail-section">
              <h2 className="detail-heading">Record ID</h2>
              <code className="record-id">{record.id}</code>
            </section>

            <section className="detail-section detail-timestamps">
              <dl>
                <dt>Created</dt><dd>{record.createdAt}</dd>
                <dt>Updated</dt><dd>{record.updatedAt}</dd>
              </dl>
            </section>
          </article>
        )}

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete expense"
          message={`Delete “${deleteTarget?.vendor}” (${deleteTarget?.documentDate})? This cannot be undone.`}
          confirmLabel="Delete expense"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Expenses</h1>
        <Link to="/expenses/new" className="btn btn-primary">Add expense</Link>
      </div>

      {error && <APIErrorBanner error={error} onRetry={refresh} />}

      {loading && items.length === 0 ? (
        <LoadingSpinner label="Loading expenses…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Add your first expense to start tracking."
          action={<Link to="/expenses/new" className="btn btn-primary">Add your first expense</Link>}
        />
      ) : (
        <>
          <table className="expense-table">
            <thead>
              <tr>
                <th scope="col">Vendor</th>
                <th scope="col">Type</th>
                <th scope="col">Date</th>
                <th scope="col">Doc. #</th>
                <th scope="col">Currency</th>
                <th scope="col">Subtotal</th>
                <th scope="col">Tax</th>
                <th scope="col">Total</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col" className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td><Link to={`/expenses/${e.id}`} className="expense-link">{e.vendor}</Link></td>
                  <td>{e.documentType}</td>
                  <td>{e.documentDate}</td>
                  <td>{e.documentNumber ?? "—"}</td>
                  <td>{e.currency}</td>
                  <td>{e.subtotal}</td>
                  <td>{e.tax}</td>
                  <td><strong>{e.total}</strong> {e.currency}</td>
                  <td>{e.category}</td>
                  <td>
                    <span className="status-pill">{e.extractionStatus}</span>
                    <span className="status-pill">{e.reviewStatus}</span>
                  </td>
                  <td className="col-actions">
                    <Link to={`/expenses/${e.id}`} className="btn btn-ghost btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {total > PAGE_SIZE && (
            <nav className="pagination" aria-label="Expense list pagination">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page + 1} · {total} expense{total !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
