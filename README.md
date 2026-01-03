# Starship Sheet

Real-time collaborative starship character sheet for Starfinder 2nd Edition. Multiple players can edit the same sheet simultaneously with WebSocket-based live synchronization.

## Features

- **Real-time collaboration** - Changes sync instantly across all connected clients
- **Shareable URLs** - Each sheet has a unique UUID for easy sharing
- **PDF export** - Download your ship sheet as a formatted PDF
- **Persistent storage** - SQLite database with automatic saving
- **Auto-reconnect** - Seamless recovery from connection drops

## Quick Start

```bash
npm install
npm start
```

Visit `http://localhost:3000` - you'll be redirected to a new sheet. Share the URL to collaborate.

## Development

```bash
npm run dev          # Start with auto-reload
PORT=8080 npm start  # Custom port
```

## Docker

```bash
docker-compose up -d              # Start with persistent data
docker-compose up --build         # Rebuild and start
```

Data persists in `./data/` directory.

## API

| Endpoint | Description |
|----------|-------------|
| `GET /` | Redirects to new sheet |
| `GET /sheet/:uuid` | Serves sheet interface |
| `GET /api/sheet/:uuid` | Get sheet data (JSON) |
| `PUT /api/sheet/:uuid` | Update entire sheet |
| `PATCH /api/sheet/:uuid` | Update single field |

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Database**: SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **PDF**: jsPDF

## License

MIT
