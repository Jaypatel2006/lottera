"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});

  // Fetch events
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

  // Countdown updater
  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdowns = {};

      events.forEach((event) => {
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
        }
      });
 
      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(timer);
  }, [events]);

  return (
    <div className="min-h-screen w-full bg-[#F4E04D] flex flex-col items-center font-sans">
      {/* Header */}
      <header className="w-full py-6 text-center shadow-md bg-[#042A2B] text-[#F4E04D]">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide">
          Lottera
        </h1>
        <p className="text-lg mt-2 text-[#F4E04D]/90">
          Try your luck. Win amazing prizes!
        </p>
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

      {/* Event List */}
      <section className="w-11/12 md:w-3/4 mt-12 mb-16 bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-[#042A2B] mb-6 text-center">
          Upcoming Events
        </h2>

        {loading ? (
          <p className="text-center text-[#042A2B] text-lg">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-center text-[#042A2B] text-lg">
            No events available right now.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-5 rounded-2xl bg-[#F4E04D] text-[#042A2B] shadow-md border border-[#042A2B]/20 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-2xl font-bold mb-2">{event.name}</h3>

                {/* ⏰ Countdown Section */}
                <p className="text-sm text-[#042A2B]/80 mb-1">
                  🕒 {new Date(event.event_time).toLocaleString()}
                </p>
                <p className="text-md font-semibold text-[#042A2B] mb-3">
                  ⏳{" "}
                  {countdowns[event.id]
                    ? countdowns[event.id]
                    : "Calculating..."}
                </p>

                <p className="text-sm text-[#042A2B]/80 mb-3">
                  💰 Prize: ₹{event.prize}
                </p>

                <button className="w-full bg-[#042A2B] text-[#F4E04D] py-2 rounded-lg font-semibold hover:opacity-90 transition">
                  <Link href="/join">Join Now</Link>
                </button>
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
