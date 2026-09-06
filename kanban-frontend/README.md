# Frontend Installation

## Prerequisites

- Node.js 22+
- Corepack and Yarn
- Backend running at `http://localhost:8000`

## Local Installation

From this directory:

```powershell
yarn install
$env:VITE_API_URL="http://localhost:8000"
yarn dev
```

Open http://localhost:5173.

## Available Commands

```powershell
yarn dev
yarn build
yarn lint
yarn preview
```

## Docker Installation

From the repository root:

```powershell
copy kanban-backend\.env.example kanban-backend\.env
docker compose up --build
```

The frontend is available at http://localhost:5173.
