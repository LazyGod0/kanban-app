# Kanban App

A Kanban board application with a React frontend, FastAPI backend, and PostgreSQL database.

## Project Structure

```text
kanban-app/
├── kanban-backend/       FastAPI API and PostgreSQL integration
│   ├── app/               Routes, models, services, repositories, and config
│   ├── tests/             Backend tests
│   ├── .env.example       Backend environment template
│   └── README.md          Backend installation guide
├── kanban-frontend/      React, TypeScript, Vite, and Material UI client
│   └── README.md          Frontend installation guide
├── docker-compose.yml     Docker services for database, backend, and frontend
└── README.md              Project overview and structure
```

## Prerequisites

For Docker:

- Docker Desktop with Docker Compose
- Git

For local development:

- Python 3.12+
- PostgreSQL 16+
- Node.js 22+
- Corepack and Yarn

## Configuration

Copy the backend environment template from the repository root:

```powershell
copy kanban-backend\.env.example kanban-backend\.env
```

Update `kanban-backend\.env` before starting:

- Replace `DB_PASSWORD`, `POSTGRES_PASSWORD`, and `JWT_SECRET` with your own values.
- Keep `POSTGRES_DB` aligned with `DB_NAME`.
- Keep `POSTGRES_USER` aligned with `DB_USER`.
- Keep `POSTGRES_PASSWORD` aligned with `DB_PASSWORD`.
- Use `DB_HOST=db` with Docker Compose.
- Use `DB_HOST=localhost` for local backend development.

Never commit `.env` or put real secrets in `.env.example`.

## Installation With Docker

From the repository root:

```powershell
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- PostgreSQL: `localhost:5432`

Useful commands:

```powershell
docker compose logs -f
docker compose down
docker compose down -v
```

`docker compose down -v` removes the PostgreSQL data volume. The backend creates the database schema during startup.

## Local Backend Installation

Start PostgreSQL, set `DB_HOST=localhost` in `kanban-backend\.env`, and run from the backend directory:

```powershell
cd kanban-backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
```

## Local Frontend Installation

Open a second terminal and run from the frontend directory:

```powershell
cd kanban-frontend
yarn install
$env:VITE_API_URL="http://localhost:8000"
yarn dev
```

Open http://localhost:5173.

Available frontend commands:

```powershell
yarn dev
yarn build
yarn lint
yarn preview
```

## Tests

Run backend tests from `kanban-backend`:

```powershell
python -m unittest discover -s tests -p "test_*.py"
```

## Production Deployment On A VPS

The repository includes a production Docker Compose stack for a single VPS. It
uses Nginx installed on the AWS host as the reverse proxy, Nginx inside the
frontend container for static files, FastAPI for the backend, and PostgreSQL
with a persistent named volume.

1. Point a domain DNS `A` record to the VPS and install Docker Engine with the
	Docker Compose plugin. Open only ports `22`, `80`, and `443` in the VPS
	firewall.
2. Copy the production environment template and replace every placeholder:

	```powershell
	copy .env.production.example .env.production
	```

	Keep `DB_HOST=db`, use a random `JWT_SECRET`, and set `COOKIE_SECURE=false`
	when accessing the application by plain EC2 IP. Set it to `true` after
	HTTPS is configured.
3. Start the production stack:

	```powershell
	docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
	docker compose -f docker-compose.prod.yml --env-file .env.production ps
	```

	Configure the host Nginx to proxy `/` to `127.0.0.1:8080`, `/api/` to
	`127.0.0.1:8000`, and `/notifications/ws` to `127.0.0.1:8000` with WebSocket
	upgrade headers. The frontend uses `/api`, and the notification socket uses
	`/notifications/ws`.
4. Check the deployment and logs:

	```powershell
	curl.exe -I http://your-ec2-public-ip
	curl.exe -i http://your-ec2-public-ip/api/health/live
	curl.exe -i http://your-ec2-public-ip/api/health/ready
	docker compose -f docker-compose.prod.yml --env-file .env.production logs -f
	```

Do not run `docker compose down -v` during normal updates because it removes
the PostgreSQL data volume. The notification WebSocket manager currently keeps
connections in backend process memory, so run one backend instance and one
worker. Add Redis/pub-sub before scaling the backend horizontally. For HTTPS,
configure a domain and Certbot on the host Nginx before setting
`COOKIE_SECURE=true`.

## More Details

- [Backend installation](kanban-backend/README.md)
- [Frontend installation](kanban-frontend/README.md)
