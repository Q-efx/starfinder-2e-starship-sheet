# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time collaborative starship character sheet for Starfinder 2nd Edition. Multiple players can edit the same sheet simultaneously with WebSocket-based live synchronization.

## Commands

```bash
npm install          # Install dependencies
npm start            # Start production server (port 3000)
npm run dev          # Start with nodemon auto-reload
PORT=8080 npm start  # Use custom port
```

### Docker

```bash
docker-compose up -d              # Start with persistent data in ./data/
docker-compose up --build         # Rebuild and start
```

## Architecture

**Server (server.js)**
- Express HTTP server with WebSocket (ws library)
- Routes: `GET /` redirects to new sheet UUID, `GET /sheet/:uuid` serves the app
- REST API: `GET|PUT|PATCH /api/sheet/:uuid`
- WebSocket broadcasts field updates to all clients on same sheet UUID
- `connections` Map tracks WebSocket clients per UUID

**Database (database.js)**
- SQLite with callback-based async wrapper (`dbOps` object)
- Table `starship_sheets` with UUID primary key
- Uses snake_case columns internally, camelCase in API responses
- DB file: `starship-sheets.db` (or `DB_PATH` env var)

**Client (public/sheet.html)**
- Single HTML file with embedded CSS and JavaScript
- WebSocket client with auto-reconnect (3 second intervals)
- All form fields have `data-field` attribute for sync
- jsPDF for PDF export (CDN loaded)

**Legacy File**
- `starship-sheet.html` - Original standalone version (localStorage only, no server)

## Form Field IDs

Fields use camelCase in client/API, snake_case in database:

| Client/API | Database |
|------------|----------|
| shipName, shipClass, shipDesc | ship_name, ship_class, ship_desc |
| armorClass, hitPoints, shields | armor_class, hit_points, shields |
| reflexSave, fortSave | reflex_save, fort_save |
| captain, engineer, gunner, pilot | captain, engineer, gunner, pilot |
| magicOfficer, scienceOfficer, medicalOfficer | magic_officer, science_officer, medical_officer |
| bonuses, description, notes | bonuses, description, notes |

## WebSocket Protocol

```json
// Client joins sheet
{ "type": "join", "uuid": "sheet-uuid" }

// Client updates field
{ "type": "update", "field": "shipName", "value": "Enterprise" }

// Server sends initial data
{ "type": "init", "data": { /* all fields */ } }

// Server broadcasts updates
{ "type": "update", "field": "shipName", "value": "Enterprise" }
```

## Modifying Form Fields

When adding/removing fields, update these locations:
1. HTML form in `public/sheet.html` (add `data-field` attribute)
2. `fieldMap` in `database.js:updateField()` for camelCase→snake_case mapping
3. `convertDbToClient()` in `server.js` for snake_case→camelCase mapping
4. Database schema in `database.js:initializeDatabase()` and `createSheet()`/`updateSheet()`
5. `exportToPDF()` in `public/sheet.html` if field should appear in PDF
