"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedLoading, setJoinedLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const router = useRouter();

  const email = localStorage.getItem("user_email");

  // --- Fetch all events ---
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("http://127.0.0.1:8000/getevents");
        const data = await res.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // --- Fetch joined events ---
  useEffect(() => {
    if (!email) return;

    async function fetchJoinedEvents() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/joined?email=${email}`);
        const data = await res.json();

        const validEvents = (data.joined_events || []).filter(
          (e) => new Date(e.event_time).getTime() > new Date().getTime()
        );

        setJoinedEvents(validEvents);
      } catch (error) {
        console.error("Error fetching joined events:", error);
      } finally {
        setJoinedLoading(false);
      }
    }

    fetchJoinedEvents();
  }, [email]);

  // --- Countdown & Auto-Finalize Logic ---
  useEffect(() => {
    const timer = setInterval(async () => {
      const newCountdowns = {};
      let eventsToFinalize = false;

      // Merge events + joined events for countdown
      const allEvents = [...events, ...joinedEvents];

      for (const event of allEvents) {
        const target = new Date(event.event_time).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((diff / (1000 * 60)) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          newCountdowns[event.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else {
          newCountdowns[event.id] = "🎉 Event Started!";
          eventsToFinalize = true; // Mark for finalization
        }
      }

      setCountdowns(newCountdowns);

      // If any event ended, call backend to finalize
      if (eventsToFinalize) {
        try {
          const res = await fetch("http://127.0.0.1:8000/api/finalize_events", {
            method: "POST",
          });
          const data = await res.json();

          if (data.winners && data.winners.length > 0) {
            data.winners.forEach((w) => {
              alert(`Event ${w.event_id} has ended!\nWinner: ${w.winner_name}\nTicket #: ${w.ticket_number}`);
            });
          }

          // Refresh events and joined events
          const eventRes = await fetch("http://127.0.0.1:8000/getevents");
          const eventData = await eventRes.json();
          setEvents(eventData.events || []);

          if (email) {
            const joinedRes = await fetch(`http://127.0.0.1:8000/joined?email=${email}`);
            const joinedData = await joinedRes.json();
            const validJoined = (joinedData.joined_events || []).filter(
              (e) => new Date(e.event_time).getTime() > new Date().getTime()
            );
            setJoinedEvents(validJoined);
          }
        } catch (error) {
          console.error("Error finalizing events:", error);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [events, joinedEvents, email]);

  // --- Join Event ---
  const handleJoin = async (eventId) => {
    if (!email) {
      alert("Please sign up or log in first!");
      router.push("/signup");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/join_event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: email, event_id: eventId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Failed to join the event!");
        return;
      }

      alert(`${data.message}\nYour Ticket Number: ${data.ticket_number}`);

      // Refresh joined events
      const joinedRes = await fetch(`http://127.0.0.1:8000/joined?email=${email}`);
      const joinedData = await joinedRes.json();
      const validEvents = (joinedData.joined_events || []).filter(
        (e) => new Date(e.event_time).getTime() > new Date().getTime()
      );
      setJoinedEvents(validEvents);
    } catch (error) {
      console.error("Error joining event:", error);
      alert("Something went wrong while joining the event.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4E04D] flex flex-col items-center font-sans">
      {/* Header */}
      <header className="w-full py-6 text-center shadow-md bg-[#042A2B] text-[#F4E04D]">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide">Lottera</h1>
        <p className="text-lg mt-2 text-[#F4E04D]/90">Try your luck. Win amazing prizes!</p>
      </header>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-6 mt-8">
        <Link href="/organise">
          <button className="px-6 py-3 bg-[#042A2B] text-[#F4E04D] rounded-2xl text-lg font-semibold hover:scale-105 transition-transform duration-200 shadow-md">
            Organise Lottery
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-6 py-3 bg-[#042A2B] text-[#F4E04D] rounded-2xl text-lg font-semibold hover:scale-105 transition-transform duration-200 shadow-md">
            Signup/Login
          </button>
        </Link>
      </div>

      {/* Upcoming Events */}
      <section className="w-11/12 md:w-3/4 mt-12 bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-[#042A2B] mb-6 text-center">Upcoming Events</h2>
        {loading ? (
          <p className="text-center text-[#042A2B] text-lg">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-center text-[#042A2B] text-lg">No events available right now.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="p-5 rounded-2xl bg-[#F4E04D] text-[#042A2B] shadow-md border border-[#042A2B]/20 hover:shadow-xl transition-shadow">
                <h3 className="text-2xl font-bold mb-2">{event.name}</h3>
                <p className="text-sm text-[#042A2B]/80 mb-1">🕒 {new Date(event.event_time).toLocaleString()}</p>
                <p className="text-md font-semibold text-[#042A2B] mb-3">⏳ {countdowns[event.id] || "Calculating..."}</p>
                <p className="text-sm text-[#042A2B]/80 mb-3">💰 Prize: ₹{event.prize}</p>
                <button onClick={() => handleJoin(event.id)} className="w-full bg-[#042A2B] text-[#F4E04D] py-2 rounded-lg font-semibold hover:opacity-90 transition">
                  Join Now
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Joined Events */}
      <section className="w-11/12 md:w-3/4 mt-12 mb-16 bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-[#042A2B] mb-6 text-center">Joined Events 🎟️</h2>
        {joinedLoading ? (
          <p className="text-center text-[#042A2B] text-lg">Loading joined events...</p>
        ) : joinedEvents.length === 0 ? (
          <p className="text-center text-[#042A2B] text-lg">You haven’t joined any events yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedEvents.map((event) => (
              <div key={event.id} className="p-5 rounded-2xl bg-[#042A2B] text-[#F4E04D] shadow-md border border-[#F4E04D]/20 hover:shadow-xl transition-shadow">
                <h3 className="text-2xl font-bold mb-2">{event.name}</h3>
                <p className="text-sm mb-1">🕒 {new Date(event.event_time).toLocaleString()}</p>
                <p className="text-md font-semibold mb-3">⏳ {countdowns[event.id] || "Calculating..."}</p>
                <p className="text-sm mb-2">🎟️ Ticket #: {event.ticket_number}</p>
                <p className="text-sm">💰 Prize: ₹{event.prize}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-[#042A2B] text-sm mb-4 opacity-70">
        © {new Date().getFullYear()} Lottera. All rights reserved.
      </footer>
    </div>
  );
}
