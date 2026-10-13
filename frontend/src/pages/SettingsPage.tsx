export function SettingsPage() {
  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <section className="card">
        <h2 className="card-heading">Application</h2>
        <p className="settings-description">
          LedgerLeaf is a single-user invoice and receipt organizer. Current configuration is managed
          through environment variables on the backend. The frontend connects to the API at the
          VITE_API_URL setting or, by default, to the proxied <code>/api</code> path during development.
        </p>
        <dl className="settings-list">
          <dt>Data storage</dt>
          <dd>Expenses are stored in a local SQLite database. Uploaded documents are stored in a
            configurable local directory outside the public frontend asset directory.</dd>
          <dt>API prefix</dt>
          <dd><code>/api/v1</code></dd>
          <dt>Health endpoint</dt>
          <dd><code>/api/health</code></dd>
        </dl>
      </section>

      <section className="card">
        <h2 className="card-heading">Document storage</h2>
        <p className="settings-description">
          The documents directory is configurable via the <code>LEDGERLEAF_DOCUMENTS_DIR</code>
          environment variable. Documents are never committed to version control and are stored outside
          the public frontend asset directory.
        </p>
      </section>

      <section className="card">
        <h2 className="card-heading">About LedgerLeaf</h2>
        <p className="settings-description">
          LedgerLeaf is built with React, TypeScript, and Vite on the frontend, and FastAPI, Pydantic,
          and SQLAlchemy on the backend. The project is a work in progress; AI-powered extraction is not
          part of this milestone.
        </p>
      </section>
    </div>
  );
}
