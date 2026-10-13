# LedgerLeaf

A single-user invoice and receipt organizer with a self-hosted open-weight AI model integration (planned).

**Milestone 1** delivers a working expense tracker: a React + TypeScript + Vite frontend, a FastAPI + SQLAlchemy + SQLite backend, full CRUD for expenses, and automated tests.

## Architecture

```
ledgerleaf/
├── backend/          # FastAPI application, SQLAlchemy models, Pydantic schemas
│   ├── app/
│   │   ├── api/      # Route handlers and CRUD helpers
│   │   ├── core/     # Settings and configuration
│   │   ├── models/   # SQLAlchemy models
│   │   └── schemas/  # Pydantic request/response schemas
│   └── tests/        # pytest tests
├── frontend/         # React + TypeScript + Vite application
│   ├── src/
│   │   ├── api/      # Typed API client
│   │   ├── components/# Reusable UI components
│   │   ├── pages/    # Route pages
│   │   └── types/    # Shared TypeScript types
│   └── tests/        # Vitest + React Testing Library tests
├── .env.example       # Example environment configuration
├── .gitignore
├── LICENSE            # Project licensing terms
└── README.md
```

## Requirements

- **Python** 3.11 or newer
- **Node.js** 20 or newer (npm 9 or newer)
- **SQLite** (bundled with Python)
- **Git** (optional, for version control)

Docker is recommended for production deployments but is not required for development.

## Quick start

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
.venv\Scripts\activate  # or: source .venv/bin/activate

# Install dependencies (includes dev tools for testing)
pip install -e ".[dev]"

# Start the API server (default: http://localhost:8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API creates the SQLite database and tables automatically on startup. The default database location is `backend/data/ledgerleaf.db`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server (default: http://localhost:5173)
npm run dev
```

The frontend proxies `/api` requests to the backend by default, so no CORS configuration is needed during development.

### Running tests

```bash
# Backend tests
cd backend
.venv\Scripts\activate
pytest

# Frontend tests
cd frontend
npm test
```

### Building the frontend for production

```bash
cd frontend
npm run build
```

The production build output is written to `frontend/dist/`.

### Lint and type checks

```bash
# Frontend TypeScript check
cd frontend
npx tsc --noEmit

# Backend has no linter configured in this milestone; pytest runs the checks
cd backend
.venv\Scripts\activate
pytest
```

## Configuration

LedgerLeaf is configured through environment variables. Copy `.env.example` to `.env` and adjust the values:

| Variable | Default | Description |
|----------|---------|-------------|
| `LEDGERLEAF_SECRET_KEY` | `change-me-in-production` | Secret key for signing. Change in production. |
| `LEDGERLEAF_APP_ORIGIN` | `http://localhost:5173` | Frontend origin for CORS. |
| `LEDGERLEAF_DATABASE_URL` | `sqlite:///backend/data/ledgerleaf.db` | Database connection URL. |
| `LEDGERLEAF_DOCUMENTS_DIR` | `backend/documents` | Directory for uploaded documents. |
| `UVICORN_HOST` | `0.0.0.0` | API server host. |
| `UVICORN_PORT` | `8000` | API server port. |
| `UVICORN_RELOAD` | `true` | Enable auto-reload in development. |

## API

The API is available at `/api/v1`. Key endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check and version info |
| `POST` | `/api/v1/expenses/create` | Create an expense |
| `GET` | `/api/v1/expenses` | List expenses (paginated) |
| `GET` | `/api/v1/expenses/{id}` | Retrieve an expense |
| `PATCH` | `/api/v1/expenses/{id}` | Update an expense |
| `DELETE` | `/api/v1/expenses/{id}` | Delete an expense |

### Health endpoint

```
GET /api/health

Response:
{
  "status": "ok",
  "version": "0.1.0"
}
```

### Error response format

All errors return a consistent JSON structure:

```json
{
  "detail": "Human-readable error message",
  "errors": [
    { "field": "field.path", "message": "Field-specific error" }
  ]
}
```

Validation errors return HTTP 422 with a `detail` of "Validation failed" and an `errors` array. Server errors return HTTP 500 with a `detail` of "Internal server error".

### Expense schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | auto | Stable record ID (UUID). |
| `vendor` | string | yes | Vendor or payee name. |
| `document_type` | string | yes | Type of document (e.g., "invoice", "receipt"). |
| `document_date` | string (ISO date) | yes | Date of the document. |
| `document_number` | string | no | Optional document/reference number. |
| `currency` | string (3 letters) | yes | ISO 4217 currency code (e.g., "USD"). |
| `subtotal` | decimal string | yes | Pre-tax amount. |
| `tax` | decimal string | yes | Tax amount. |
| `total` | decimal string | yes | Total amount including tax. |
| `category` | string | yes | Expense category. |
| `original_document_reference` | string | no | Link or reference to the original document. |
| `notes` | string | no | Additional notes. |
| `extraction_status` | string | auto | Extraction status (default: "manual"). |
| `review_status` | string | auto | Review status (default: "unreviewed"). |
| `created_at` | string (ISO datetime) | auto | Record creation timestamp. |
| `updated_at` | string (ISO datetime) | auto | Record last update timestamp. |

All monetary amounts are stored as `NUMERIC(12,4)` in SQLite to avoid floating-point precision loss. The API accepts and returns amounts as decimal strings.

## Database migration strategy

LedgerLeaf uses **Alembic** for database migrations. The current milestone uses `Base.metadata.create_all()` on startup for simplicity, but the project is structured to support Alembic migrations as the schema evolves.

### Migration workflow

1. **Generate a migration** after changing SQLAlchemy models:
   ```bash
   cd backend
   alembic revision --autogenerate -m "describe your change"
   ```
2. **Review the generated migration** in `alembic/versions/`.
3. **Apply the migration**:
   ```bash
   alembic upgrade head
   ```

### Current state

- The initial schema is defined in `backend/app/models/expense.py`.
- `backend/app/database.py` provides the engine, session factory, and `create_tables()` helper.
- `backend/app/main.py` calls `create_tables()` on startup for development convenience.
- Alembic is installed and configured (`backend/pyproject.toml` includes it as a dependency; `backend/app/core/settings.py` provides `DATABASE_URL`).
- The `alembic/` directory is not yet initialized. Run `alembic init alembic` in `backend/` to set it up, then configure `alembic.ini` to use the `LEDGERLEAF_DATABASE_URL` environment variable.

### Future milestones

When the schema grows beyond the initial expense table, switch from `create_tables()` to Alembic migrations. The migration strategy will be:
- Every model change is accompanied by a generated Alembic migration.
- Migrations are reviewed and committed alongside the model changes.
- The application applies migrations on startup (or via a separate deploy step).
- Rollbacks are supported via `alembic downgrade`.

## Dependency licensing

This project depends on many third-party libraries. A preliminary licensing review process:

1. **Inventory**: List all dependencies from `backend/pyproject.toml` and `frontend/package.json`.
2. **Scan**: Use a license scanning tool (e.g., `pip-licenses`, `npm license`, or GitHub Dependabot) to identify each dependency's license.
3. **Review**: Check that each license is compatible with the project's intended use. MIT, Apache 2.0, and BSD licenses are generally permissive. GPL-family licenses require careful review.
4. **Document**: Maintain a `LICENSE-dePENDENCIES.md` or similar file listing each dependency, its version, and its license.
5. **Monitor**: Re-check licenses when dependencies are updated.

**This milestone does not claim that every dependency has been audited.** The licensing process is preliminary and will be completed before any production deployment.

## Testing

### Backend tests (pytest)

Backend tests use an isolated file-based SQLite database so that records persist across the test client's connections. Tests cover:

1. API health endpoint works.
2. An expense can be created and retrieved.
3. An expense can be updated and deleted.
4. Invalid required fields are rejected.
5. Invalid dates and currency codes are rejected.
6. Decimal amounts round-trip without precision loss.
7. Database records persist across application restarts.

### Frontend tests (Vitest + React Testing Library)

Frontend tests verify:

1. The expense list shows an empty state when there are no expenses.
2. The expense list shows a loading spinner while fetching.
3. The expense list shows an error banner when the API fails, with a retry button.
4. The expense list renders data when it arrives.
5. The create form renders on `/expenses/new`.
6. The create form submits data to the API on success.
7. The create form validates required fields and shows errors.

### Browser tests (Playwright)

Playwright browser tests are planned for a future milestone, once the application is integrated end-to-end.

## Development

### Frontend development

The frontend uses Vite's hot module replacement. Edit a file and the browser updates automatically.

```bash
cd frontend
npm run dev
```

### Backend development

The backend uses Uvicorn's `--reload` flag for auto-reloading.

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

## Known limitations

- The documents page is a placeholder; document upload and association are planned for a future milestone.
- AI-powered extraction is not part of this milestone.
- The Alembic migration setup is not initialized; migrations will be added as the schema evolves.
- Dependency licensing has not been fully audited.
- No authentication or multi-user support (single-user application by design).

## Next milestone

Milestone 2 will add:
- Document upload and storage in the configured `LEDGERLEAF_DOCUMENTS_DIR`.
- Association of uploaded documents with expenses.
- Preliminary AI model integration setup (model loading, inference pipeline skeleton).
- Playwright browser tests for the integrated application.
- Alembic migration setup.

## License

LedgerLeaf is provided as-is for development and evaluation. See `LICENSE` for the full license text.
