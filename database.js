const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database
const dbPath = process.env.DB_PATH || path.join(__dirname, 'starship-sheets.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected');
    initializeDatabase();
  }
});

// Initialize database schema
function initializeDatabase() {
  db.serialize(() => {
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS starship_sheets (
        uuid TEXT PRIMARY KEY,
        ship_name TEXT,
        ship_class TEXT,
        ship_desc TEXT,
        armor_class TEXT,
        hit_points TEXT,
        shields TEXT,
        reflex_save TEXT,
        fort_save TEXT,
        captain TEXT,
        engineer TEXT,
        gunner TEXT,
        magic_officer TEXT,
        pilot TEXT,
        science_officer TEXT,
        medical_officer TEXT,
        bonuses TEXT,
        description TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_uuid ON starship_sheets(uuid)`);
  });
}

// Database operations with callback-based API
const dbOps = {
  getSheet(uuid) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM starship_sheets WHERE uuid = ?', [uuid], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  createSheet(uuid, data = {}) {
    const sheet = {
      uuid,
      ship_name: data.shipName || '',
      ship_class: data.shipClass || '',
      ship_desc: data.shipDesc || '',
      armor_class: data.armorClass || '',
      hit_points: data.hitPoints || '',
      shields: data.shields || '',
      reflex_save: data.reflexSave || '',
      fort_save: data.fortSave || '',
      captain: data.captain || '',
      engineer: data.engineer || '',
      gunner: data.gunner || '',
      magic_officer: data.magicOfficer || '',
      pilot: data.pilot || '',
      science_officer: data.scienceOfficer || '',
      medical_officer: data.medicalOfficer || '',
      bonuses: data.bonuses || '',
      description: data.description || '',
      notes: data.notes || ''
    };

    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO starship_sheets (
          uuid, ship_name, ship_class, ship_desc, armor_class, hit_points,
          shields, reflex_save, fort_save, captain, engineer, gunner,
          magic_officer, pilot, science_officer, medical_officer,
          bonuses, description, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        sheet.uuid, sheet.ship_name, sheet.ship_class, sheet.ship_desc,
        sheet.armor_class, sheet.hit_points, sheet.shields, sheet.reflex_save,
        sheet.fort_save, sheet.captain, sheet.engineer, sheet.gunner,
        sheet.magic_officer, sheet.pilot, sheet.science_officer,
        sheet.medical_officer, sheet.bonuses, sheet.description, sheet.notes
      ],
      (err) => {
        if (err) reject(err);
        else resolve(sheet);
      });
    });
  },

  updateSheet(uuid, data) {
    const sheet = {
      ship_name: data.shipName || '',
      ship_class: data.shipClass || '',
      ship_desc: data.shipDesc || '',
      armor_class: data.armorClass || '',
      hit_points: data.hitPoints || '',
      shields: data.shields || '',
      reflex_save: data.reflexSave || '',
      fort_save: data.fortSave || '',
      captain: data.captain || '',
      engineer: data.engineer || '',
      gunner: data.gunner || '',
      magic_officer: data.magicOfficer || '',
      pilot: data.pilot || '',
      science_officer: data.scienceOfficer || '',
      medical_officer: data.medicalOfficer || '',
      bonuses: data.bonuses || '',
      description: data.description || '',
      notes: data.notes || ''
    };

    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE starship_sheets SET
          ship_name = ?,
          ship_class = ?,
          ship_desc = ?,
          armor_class = ?,
          hit_points = ?,
          shields = ?,
          reflex_save = ?,
          fort_save = ?,
          captain = ?,
          engineer = ?,
          gunner = ?,
          magic_officer = ?,
          pilot = ?,
          science_officer = ?,
          medical_officer = ?,
          bonuses = ?,
          description = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE uuid = ?
      `,
      [
        sheet.ship_name, sheet.ship_class, sheet.ship_desc,
        sheet.armor_class, sheet.hit_points, sheet.shields, sheet.reflex_save,
        sheet.fort_save, sheet.captain, sheet.engineer, sheet.gunner,
        sheet.magic_officer, sheet.pilot, sheet.science_officer,
        sheet.medical_officer, sheet.bonuses, sheet.description, sheet.notes,
        uuid
      ],
      (err) => {
        if (err) {
          reject(err);
        } else {
          dbOps.getSheet(uuid).then(resolve).catch(reject);
        }
      });
    });
  },

  updateField(uuid, fieldName, value) {
    // Map camelCase to snake_case for database
    const fieldMap = {
      shipName: 'ship_name',
      shipClass: 'ship_class',
      shipDesc: 'ship_desc',
      armorClass: 'armor_class',
      hitPoints: 'hit_points',
      shields: 'shields',
      reflexSave: 'reflex_save',
      fortSave: 'fort_save',
      captain: 'captain',
      engineer: 'engineer',
      gunner: 'gunner',
      magicOfficer: 'magic_officer',
      pilot: 'pilot',
      scienceOfficer: 'science_officer',
      medicalOfficer: 'medical_officer',
      bonuses: 'bonuses',
      description: 'description',
      notes: 'notes'
    };

    const dbField = fieldMap[fieldName];
    if (!dbField) {
      return Promise.reject(new Error(`Invalid field name: ${fieldName}`));
    }

    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE starship_sheets
        SET ${dbField} = ?, updated_at = CURRENT_TIMESTAMP
        WHERE uuid = ?
      `,
      [value, uuid],
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

module.exports = { db, dbOps };
