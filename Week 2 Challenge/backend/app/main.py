import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.settings import APP_ORIGIN, API_PREFIX
from app.database import create_tables
from app.api import router as expense_router
from app import __version__

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ledgerleaf")


def _build_app() -> FastAPI:
    app = FastAPI(
        title="LedgerLeaf API",
        version=__version__,
        description="Invoice and receipt organizer backend",
        docs_url="/docs",
        openapi_url="/openapi.json",
        debug=False,
    )

    app.include_router(expense_router, prefix=API_PREFIX)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "version": __version__}

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            loc = ".".join(str(x) for x in err["loc"])
            msg = err["msg"]
            errors.append({"field": loc, "message": msg})
        return JSONResponse(
            status_code=422,
            content={"detail": "Validation failed", "errors": errors},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    return app


app = _build_app()


@app.on_event("startup")
def on_startup():
    data_dir = Path(__file__).resolve().parent.parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    create_tables()
    logger.info("LedgerLeaf API started")
