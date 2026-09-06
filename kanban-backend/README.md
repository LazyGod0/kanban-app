# Backend Installation

## Configuration

From the repository root, copy the environment template:

```powershell
copy kanban-backend\.env.example kanban-backend\.env
```

Update `kanban-backend\.env` before running the backend. When using Docker Compose, keep the `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` values aligned with `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. Use:

- `DB_HOST=db` when running with Docker Compose
- `DB_HOST=localhost` when running the backend locally with PostgreSQL on your machine

Change `DB_PASSWORD` and `JWT_SECRET` from their placeholder values. Keep `.env` private and never commit it.

## Docker Installation

From the repository root:

```powershell
docker compose up --build backend db
```

The backend is available at http://localhost:8000. API documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

The backend checks the database connection and creates the database schema during startup.

## Local Installation

Create `kanban-backend\.env`, start PostgreSQL, and set `DB_HOST=localhost`. Then run from this directory:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
```

Run the API from the `kanban-backend` directory so the application loads the local `.env` file correctly.

## Database

The application creates its tables automatically during startup. There is currently no separate migration command.
