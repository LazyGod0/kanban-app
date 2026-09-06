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

## Installation Guides

- [Backend installation](kanban-backend/README.md)
- [Frontend installation](kanban-frontend/README.md)
