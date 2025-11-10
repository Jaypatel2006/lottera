import sqlite3

# Connect to the SQLite database file
conn = sqlite3.connect("database.db")
cursor = conn.cursor()

# Execute multiple SQL statements using executescript
cursor.executescript('''
-- 1. Create the USERS table, now including the 'password' column
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL, -- Added UNIQUE and NOT NULL constraints for better data integrity
    password TEXT NOT NULL -- MANDATORY: Column to store the password
);

-- 2. Create the ORGANISERS table
CREATE TABLE IF NOT EXISTS organisers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
);

-- 3. Create the EVENTS table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    event_time TEXT,
    prize INTEGER NOT NULL
);

-- 4. Create the PARTICIPANTS table
CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    name TEXT,
    email TEXT,
    ticket_number INTEGER,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- 5. Create the WINNERS table
CREATE TABLE IF NOT EXISTS winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    winner_name TEXT,
    winner_email TEXT,
    ticket_number INTEGER,
    FOREIGN KEY (event_id) REFERENCES events(id)
); 

''')

# Since the previous users table definition might not have had 'password', 
# we use ALTER TABLE to add it if it doesn't exist.
# NOTE: This part is crucial if you run this script AFTER the table was initially created without 'password'.
try:
    cursor.execute("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT '';")
    # After adding a NOT NULL column with a default value, you can remove the default if desired,
    # but for simplicity in this case, we'll leave it as is.
    print("✅ ALTER TABLE executed successfully (Added 'password' column to users).")
except sqlite3.OperationalError as e:
    # This happens if the column already exists, which is fine.
    if "duplicate column name" in str(e):
        print("ℹ️ 'password' column already exists in 'users' table. Skipping ALTER.")
    else:
        # Re-raise unexpected database errors
        raise e


conn.commit()
conn.close()

print("✅ Tables initialized successfully!")