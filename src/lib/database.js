import sqlite3 from 'sqlite3';
import { resolve } from 'path';
import fs from 'fs';

// Path to SQLite database file
const dataDir = resolve(__dirname, '../../data');
const dbPath = resolve(dataDir, 'embeddings.db');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Data directory created at:', dataDir);
}
// Ensure the database file exists
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
    console.log('Database file created at:', dbPath);
}

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create embeddings table if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        embedding TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Embeddings table is ready.');
        }
    });
});

export default db;