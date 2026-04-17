const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/line_pet.db';
const dbDir = path.dirname(dbPath);

if (dbDir !== '/tmp' && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_user_id TEXT UNIQUE NOT NULL,
      display_name TEXT,
      picture_url TEXT,
      state TEXT DEFAULT 'IDLE',
      state_context TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      breed TEXT,
      birth_date TEXT,
      gender TEXT,
      chip_number TEXT,
      notes TEXT,
      health_tag TEXT DEFAULT 'healthy',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pet_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      photo_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets(id)
    );

    CREATE TABLE IF NOT EXISTS care_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner_id INTEGER NOT NULL,
      invite_code TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES care_groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS group_pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      FOREIGN KEY (group_id) REFERENCES care_groups(id),
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      UNIQUE(group_id, pet_id)
    );

    CREATE TABLE IF NOT EXISTS care_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      pet_id INTEGER NOT NULL,
      task_type TEXT NOT NULL,
      description TEXT,
      assigned_user_id INTEGER,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      completed_at DATETIME,
      completed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id),
      FOREIGN KEY (completed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      reminder_type TEXT NOT NULL,
      reminder_time TEXT NOT NULL,
      message TEXT,
      is_active INTEGER DEFAULT 1,
      last_sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (pet_id) REFERENCES pets(id)
    );

    CREATE TABLE IF NOT EXISTS virtual_pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      pet_id INTEGER,
      original_photo_url TEXT,
      generated_description TEXT,
      style TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (pet_id) REFERENCES pets(id)
    );
  `);
}

module.exports = { db, initDb };
