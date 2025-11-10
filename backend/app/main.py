from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel 
import sqlite3 
from fastapi.middleware.cors import CORSMiddleware
import random
from datetime import datetime

app = FastAPI()

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Connection ---
conn = sqlite3.connect("../database/database.db", check_same_thread=False)
cursor = conn.cursor()

# --- Models ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Organiser(BaseModel):
    name: str
    email: str
    event_name: str
    prize_money: int
    event_time: str

class JoinEvent(BaseModel):
    user_email: str
    event_id: int 


# --- AUTH ENDPOINTS ---

@app.post("/api/signup")
def signup(user: UserCreate):
    # Check if user already exists
    cursor.execute("SELECT email FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
            (user.name, user.email, user.password)
        )
        conn.commit()
        return {"message": f"User {user.name} registered successfully!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


@app.post("/api/login")
def login(form_data: UserLogin):
    cursor.execute("SELECT name, email, password FROM users WHERE email = ?", (form_data.email,))
    db_user = cursor.fetchone()

    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    user_name, user_email, db_password = db_user

    if form_data.password != db_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

    return {"message": "Login successful", "email": user_email, "name": user_name}


# --- EVENTS ENDPOINTS ---

@app.get("/getevents")
def fetch_events():
    cursor.execute("SELECT id, name, event_time, prize FROM events")
    rows = cursor.fetchall()
    columns = [description[0] for description in cursor.description]
    events = [dict(zip(columns, row)) for row in rows]
    return {"events": events}


@app.post("/api/add_organiser")
def add_organiser(org: Organiser):
    try:
        cursor.execute(
            """
            INSERT INTO organisers (name, email, event_name, prize_money, event_time)
            VALUES (?, ?, ?, ?, ?)
            """,
            (org.name, org.email, org.event_name, org.prize_money, org.event_time)
        )

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


# --- PARTICIPATION LOGIC ---

@app.post("/api/join_event")
def join_event(join_data: JoinEvent):
    user_email = join_data.user_email
    event_id = join_data.event_id

    # Check if user exists
    cursor.execute("SELECT name FROM users WHERE email = ?", (user_email,))
    user_row = cursor.fetchone()
    if not user_row:
        raise HTTPException(status_code=404, detail="User not found.")
    
    user_name = user_row[0]

    # Check if already joined
    cursor.execute(
        "SELECT ticket_number FROM participants WHERE email = ? AND event_id = ?",
        (user_email, event_id)
    )
    existing_participant = cursor.fetchone()
    if existing_participant:
        return {"message": "You have already joined this event!", "ticket_number": existing_participant[0]}

    # Get the next ticket number for this event
    cursor.execute(
        "SELECT MAX(ticket_number) FROM participants WHERE event_id = ?",
        (event_id,)
    )
    max_ticket = cursor.fetchone()[0]
    if max_ticket is None:
        ticket_number = 1
    else:
        ticket_number = max_ticket + 1

    # Insert participation
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


# --- FETCH USER'S JOINED EVENTS (for frontend 'Joined Events' section) ---
@app.get("/joined")
def get_joined_events(email: str):
    try:
        cursor.execute("""
            SELECT 
                e.id AS id,
                e.name AS name,
                e.event_time AS event_time,
                e.prize AS prize,
                p.ticket_number AS ticket_number
            FROM participants p
            JOIN events e ON p.event_id = e.id
            WHERE p.email = ?
        """, (email,))
        
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        joined_events = [dict(zip(columns, row)) for row in rows]
        print(joined_events)
        

        return {"joined_events": joined_events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching joined events: {e}")


from fastapi import APIRouter

@app.delete("/api/remove_past_events")
def remove_past_events():
    try:
        now = datetime.now()
        
        # Fetch past events
        cursor.execute("SELECT id, event_time FROM events")
        events = cursor.fetchall()

        past_event_ids = []
        for e in events:
            event_id, event_time_str = e
            try:
                event_time = datetime.fromisoformat(event_time_str)
            except:
                event_time = datetime.strptime(event_time_str, "%Y-%m-%d %H:%M:%S")
            
            if event_time <= now:
                past_event_ids.append(event_id)

        if not past_event_ids:
            return {"message": "No past events to remove."}

        # Remove from winners, participants, and events
        for event_id in past_event_ids:
            cursor.execute("DELETE FROM winners WHERE event_id = ?", (event_id,))
            cursor.execute("DELETE FROM participants WHERE event_id = ?", (event_id,))
            cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))

        conn.commit()
        return {"message": f"Removed {len(past_event_ids)} past events successfully.", "removed_event_ids": past_event_ids}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")



@app.post("/api/finalize_events")
def finalize_events():
    try:
        now = datetime.now()
        # Get all past events
        cursor.execute("SELECT id FROM events")
        events = cursor.fetchall()
        past_event_ids = []

        for e in events:
            event_id = e[0]
            cursor.execute("SELECT event_time FROM events WHERE id = ?", (event_id,))
            event_time_str = cursor.fetchone()[0]
            try:
                event_time = datetime.fromisoformat(event_time_str)
            except:
                event_time = datetime.strptime(event_time_str, "%Y-%m-%d %H:%M:%S")
            
            if event_time <= now:
                past_event_ids.append(event_id)

        if not past_event_ids:
            return {"message": "No events to finalize."}

        winners_info = []

        for event_id in past_event_ids:
            # Get all participants
            cursor.execute("SELECT name, email, ticket_number FROM participants WHERE event_id = ?", (event_id,))
            participants = cursor.fetchall()

            if participants:
                winner = random.choice(participants)
                winner_name, winner_email, winner_ticket = winner

                # Save winner to winners table
                cursor.execute(
                    "INSERT INTO winners (event_id, winner_name, winner_email, ticket_number) VALUES (?, ?, ?, ?)",
                    (event_id, winner_name, winner_email, winner_ticket)
                )
                winners_info.append({
                    "event_id": event_id,
                    "winner_name": winner_name,
                    "winner_email": winner_email,
                    "ticket_number": winner_ticket
                })

            # Delete participants
            cursor.execute("DELETE FROM participants WHERE event_id = ?", (event_id,))
            # Delete event
            cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))

        conn.commit()
        return {"message": "Finalized past events successfully.", "winners": winners_info}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

