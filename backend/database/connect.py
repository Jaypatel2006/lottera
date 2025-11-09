import sqlite3

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

cursor.executescript('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS organisers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    event_time TEXT,
    prize INTEGER NOT NULL
);
                     

ALTER TABLE organisers ADD COLUMN event_name TEXT;
ALTER TABLE organisers ADD COLUMN prize_money INTEGER;
ALTER TABLE organisers ADD COLUMN event_time TEXT;

''')

conn.commit()
conn.close()

print("✅ Tables created successfully!")
