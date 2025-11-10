from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel 
import sqlite3 
from fastapi.middleware.cors import CORSMiddleware
import random
from passlib.context import CryptContext

app = FastAPI()

# --- Security Setup (Hashing) ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)
# ---------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite Connection - Ensure this path is correct relative to your execution
# NOTE: Using a path relative to the current file execution
conn = sqlite3.connect("../database/database.db", check_same_thread=False)
cursor = conn.cursor()

# --- Pydantic Models ---

class UserCreate(BaseModel): # For registration
    name: str
    email: str
    password: str

class UserLogin(BaseModel): # For login
    email: str
    password: str

class User(BaseModel): # Existing model for general submission (used in old /api/add_user)
    name: str
    email: str

class Organiser(BaseModel):
    name: str
    email: str
    event_name: str
    prize_money: int
    event_time: str

class JoinEvent(BaseModel): # Updated to include user email
    user_email: str
    event_id: int 

# --- New/Updated Auth Endpoints ---

@app.post("/api/signup")
def signup(user: UserCreate):
    # Check if user already exists
    cursor.execute("SELECT email FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    

    # Store user in DB
    try:
        # Note: 'password' column stores the hashed value
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
                       (user.name, user.email, user.password))
        conn.commit()
        return {"message": f"User {user.name} registered successfully!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


@app.post("/api/login")
def login(form_data: UserLogin):
    # Fetch user from DB
    cursor.execute("SELECT name, email, password FROM users WHERE email = ?", (form_data.email,))
    db_user = cursor.fetchone()

    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    user_name, user_email, password = db_user
    if(form_data.password==password):
        return {"message":"incorrect Password"}
    # Verify password
    
    # Success: Return user data. The client will store the email as the session key.
    return {"message": "Login successful", "email": user_email, "name": user_name}

# --- Standard App Endpoints (Secured by passing email) ---

@app.post("/api/add_user")
def add_user(user: User):
    # This endpoint is probably outdated by /api/signup, but kept for compatibility
    cursor.execute("INSERT INTO users (name, email) VALUES (?, ?)", (user.name, user.email))
    conn.commit()
    return {"message": f"User {user.name} added successfully!"}

@app.get("/getevents")
def fetch_events():
    cursor.execute("SELECT id, name, event_time, prize FROM events")
    rows = cursor.fetchall()
    columns = [description[0] for description in cursor.description]
    events = [dict(zip(columns, row)) for row in rows]
    return {"events": events}

@app.post("/api/join_event")
def join_event(join_data: JoinEvent):
    user_email = join_data.user_email
    event_id = join_data.event_id

    # Check if the user exists
    cursor.execute("SELECT name FROM users WHERE email = ?", (user_email,))
    user_row = cursor.fetchone()
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found.")
    
    user_name = user_row[0]

    # Check if the user is already a participant in this event
    cursor.execute(
        "SELECT ticket_number FROM participants WHERE email = ? AND event_id = ?",
        (user_email, event_id)
    )
    existing_participant = cursor.fetchone()

    if existing_participant:
        return {"message": "You have already joined this event!", "ticket_number": existing_participant[0]}

    # Generate a simple ticket number
    ticket_number = random.randint(100000, 999999)
    
    try:
        cursor.execute(
            """
            INSERT INTO participants (event_id, name, email, ticket_number)
            VALUES (?, ?, ?, ?)
            """,
            (event_id, user_name, user_email, ticket_number)
        )
        conn.commit()
        return {"message": "Successfully joined the event!", "ticket_number": ticket_number}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

# This endpoint is secured by relying on the client passing the correct email
@app.get("/api/my_events/{user_email}")
def fetch_my_events(user_email: str):
    # Select joined events and their details, including ticket number
    cursor.execute(
        """
        SELECT 
            p.ticket_number, 
            e.name as event_name, 
            e.event_time, 
            e.prize
        FROM 
            participants p
        JOIN 
            events e ON p.event_id = e.id
        WHERE 
            p.email = ?
        """,
        (user_email,)
    )
    rows = cursor.fetchall()
    columns = [description[0] for description in cursor.description]
    joined_events = [dict(zip(columns, row)) for row in rows]
    return {"joined_events": joined_events}

@app.post("/api/add_organiser")
def add_organiser(org: Organiser):
    try:
        # Insert into organisers table
        cursor.execute(
            """
            INSERT INTO organisers (name, email, event_name, prize_money, event_time)
            VALUES (?, ?, ?, ?, ?)
            """,
            (org.name, org.email, org.event_name, org.prize_money, org.event_time)
        )

        # Insert into events table
        cursor.execute(
            """
            INSERT INTO events (name, event_time, prize)
            VALUES (?, ?, ?)
            """,
            (org.event_name, org.event_time, org.prize_money)
        )

        conn.commit()
        return {"message": "Organiser and event added successfully!"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))