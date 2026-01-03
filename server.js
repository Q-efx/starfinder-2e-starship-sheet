const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { dbOps } = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Store active connections per UUID
const connections = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  let currentUuid = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'join') {
        // Client joining a specific sheet
        currentUuid = data.uuid;

        // Add this connection to the UUID's connection pool
        if (!connections.has(currentUuid)) {
          connections.set(currentUuid, new Set());
        }
        connections.get(currentUuid).add(ws);

        console.log(`Client joined sheet: ${currentUuid}`);

        // Send current sheet data to the client
        const sheet = await dbOps.getSheet(currentUuid);
        if (sheet) {
          ws.send(JSON.stringify({
            type: 'init',
            data: convertDbToClient(sheet)
          }));
        }
      } else if (data.type === 'update') {
        // Client updated a field
        if (!currentUuid) return;

        const { field, value } = data;

        // Update database
        await dbOps.updateField(currentUuid, field, value);

        // Broadcast to all other clients connected to this UUID
        const clients = connections.get(currentUuid);
        if (clients) {
          const updateMessage = JSON.stringify({
            type: 'update',
            field,
            value
          });

          clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) { // OPEN state
              client.send(updateMessage);
            }
          });
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    // Remove this connection from the UUID's connection pool
    if (currentUuid && connections.has(currentUuid)) {
      connections.get(currentUuid).delete(ws);

      // Clean up empty connection pools
      if (connections.get(currentUuid).size === 0) {
        connections.delete(currentUuid);
      }

      console.log(`Client left sheet: ${currentUuid}`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Helper function to convert database snake_case to client camelCase
function convertDbToClient(dbSheet) {
  return {
    shipName: dbSheet.ship_name,
    shipClass: dbSheet.ship_class,
    shipDesc: dbSheet.ship_desc,
    armorClass: dbSheet.armor_class,
    hitPoints: dbSheet.hit_points,
    shields: dbSheet.shields,
    reflexSave: dbSheet.reflex_save,
    fortSave: dbSheet.fort_save,
    captain: dbSheet.captain,
    engineer: dbSheet.engineer,
    gunner: dbSheet.gunner,
    magicOfficer: dbSheet.magic_officer,
    pilot: dbSheet.pilot,
    scienceOfficer: dbSheet.science_officer,
    medicalOfficer: dbSheet.medical_officer,
    bonuses: dbSheet.bonuses,
    description: dbSheet.description,
    notes: dbSheet.notes
  };
}

// Routes

// Root route - redirect to new sheet
app.get('/', async (req, res) => {
  const newUuid = uuidv4();
  await dbOps.createSheet(newUuid);
  res.redirect(`/sheet/${newUuid}`);
});

// Get sheet by UUID
app.get('/sheet/:uuid', async (req, res) => {
  const { uuid } = req.params;
  const sheet = await dbOps.getSheet(uuid);

  if (!sheet) {
    return res.status(404).send('Sheet not found');
  }

  res.sendFile(path.join(__dirname, 'public', 'sheet.html'));
});

// API: Get sheet data
app.get('/api/sheet/:uuid', async (req, res) => {
  const { uuid } = req.params;
  const sheet = await dbOps.getSheet(uuid);

  if (!sheet) {
    return res.status(404).json({ error: 'Sheet not found' });
  }

  res.json(convertDbToClient(sheet));
});

// API: Update entire sheet
app.put('/api/sheet/:uuid', async (req, res) => {
  const { uuid } = req.params;
  const sheet = await dbOps.getSheet(uuid);

  if (!sheet) {
    return res.status(404).json({ error: 'Sheet not found' });
  }

  const updated = await dbOps.updateSheet(uuid, req.body);
  res.json(convertDbToClient(updated));
});

// API: Update single field
app.patch('/api/sheet/:uuid', async (req, res) => {
  const { uuid } = req.params;
  const { field, value } = req.body;

  const sheet = await dbOps.getSheet(uuid);
  if (!sheet) {
    return res.status(404).json({ error: 'Sheet not found' });
  }

  try {
    await dbOps.updateField(uuid, field, value);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Starship Sheet server running on http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT} to create a new sheet`);
});
