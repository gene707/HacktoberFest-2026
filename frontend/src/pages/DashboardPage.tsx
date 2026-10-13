import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiHealth, listExpenses } from "../api/client";
import { LoadingSpinner, APIErrorBanner } from "../components";
import type { Expense } from "../types/expenses";

export function DashboardPage() {
  const [health, setHealth] = useState<{ status: string; version: string } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [h, e] = await Promise.all([apiHealth(), listExpenses(0, 10)]);
        if (!cancelled) {
          setHealth(h);
          setExpenses(e.items);
          setTotal(e.total);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page dashboard-page">
      <h1 className="page-title">Dashboard</h1>

      <div className="dashboard-grid">
        <section className="card stat-card">
          <h2 className="stat-label">Recent expenses</h2>
          {loading ? (
            <LoadingSpinner label="Loading expenses…" />
          ) : error ? (
            <APIErrorBanner error={error} />
          ) : expenses.length === 0 ? (
            <p className="stat-empty">No expenses yet.</p>
          ) : (
            <ol className="stat-list">
              {expenses.map((e) => (
                <li key={e.id} className="stat-item">
                  <Link to={`/expenses/${e.id}`} className="stat-link">
                    <span className="stat-vendor">{e.vendor}</span>
                    <span className="stat-meta">{e.documentType} · {e.documentDate}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card stat-card">
          <h2 className="stat-label">Total expenses</h2>
          {loading ? (
            <LoadingSpinner label="Calculating…" />
          ) : (
            <p className="stat-value">{total}</p>
          )}
        </section>

        <section className="card stat-card">
          <h2 className="stat-label">API status</h2>
          {loading ? (
            <LoadingSpinner label="Checking API…" />
          ) : health ? (
            <p className="stat-value">
              <span className="status-ok" aria-label="API is healthy">Healthy</span>
              <span className="status-version">v{health.version}</span>
            </p>
          ) : (
            <p className="stat-value status-unknown">Unknown</p>
          )}
        </section>

        <section className="card action-card">
          <h2 className="action-title">Quick actions</h2>
          <ul className="action-list">
            <li>
              <Link to="/expenses/new" className="action-link">
                Add expense
              </Link>
            </li>
            <li>
              <Link to="/expenses" className="action-link">
                View all expenses
              </Link>
            </li>
            <li>
              <Link to="/settings" className="action-link">
                Open settings
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
