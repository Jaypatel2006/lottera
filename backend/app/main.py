from fastapi import FastAPI
from pydantic import BaseModel 
import sqlite3 
app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




class User(BaseModel):
    name: str
    email: str


class Organiser(BaseModel):
    name: str
    email: str
    event_name: str
    prize_money: int
    event_time: str


conn = sqlite3.connect("../database/database.db", check_same_thread=False)
cursor = conn.cursor()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/add_user")
def add_user(user: User):
    cursor.execute("INSERT INTO users (name, email) VALUES (?, ?)", (user.name, user.email))
    conn.commit()
    return {"message": f"User {user.name} added successfully!"}

@app.get("/getevents")
def fetch_events():
    cursor.execute("SELECT * FROM events")
    rows = cursor.fetchall()

    
    columns = [description[0] for description in cursor.description]

   
    events = [dict(zip(columns, row)) for row in rows]

    return {"events": events}



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
        return {"error": str(e)}

