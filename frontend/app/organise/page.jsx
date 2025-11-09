"use client";

import { useState } from "react";

export default function OrganisePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    event_name: "",
    prize_money: "",
    event_time: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting...");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/add_organiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setMessage(data.message);
      setFormData({
        name: "",
        email: "",
        event_name: "",
        prize_money: "",
        event_time: "",
      });
    } catch (err) {
      console.error(err);
      setMessage("Error submitting form");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F4E04D] text-[#042A2B]">
      <div className="bg-white shadow-lg rounded-3xl p-8 w-11/12 md:w-1/2 lg:w-1/3">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#042A2B]">
          Organise a Lottery Event 🎟️
        </h1>

        <form className="flex flex-col space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="p-3 border border-[#042A2B]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042A2B]"
            required
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="p-3 border border-[#042A2B]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042A2B]"
            required
          />

          <input
            type="text"
            name="event_name"
            value={formData.event_name}
            onChange={handleChange}
            placeholder="Event Name"
            className="p-3 border border-[#042A2B]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042A2B]"
            required
          />

          <input
            type="number"
            name="prize_money"
            value={formData.prize_money}
            onChange={handleChange}
            placeholder="Prize Money"
            className="p-3 border border-[#042A2B]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042A2B]"
            required
          />

          <input
            type="datetime-local"
            name="event_time"
            value={formData.event_time}
            onChange={handleChange}
            className="p-3 border border-[#042A2B]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#042A2B]"
            required
          />

          <button
            type="submit"
            className="bg-[#042A2B] text-[#F4E04D] font-semibold py-3 rounded-lg hover:scale-105 transition-transform duration-200"
          >
            Create Event
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-[#042A2B] font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
