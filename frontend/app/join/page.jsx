"use client";

import { useState } from "react";

export default function UserForm() {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://127.0.0.1:8000/api/add_user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    alert(data.message);
    setFormData({ name: "", email: "" });
  } catch (err) {
    console.error("Error:", err);
    alert("Failed to submit!");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#042A2B]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#F4E04D] rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-[#042A2B] text-center mb-6">
          Join the Lottery
        </h1>

        <div className="mb-4">
          <label
            htmlFor="name"
            className="block text-[#042A2B] font-semibold mb-2"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg border text-[#042A2B] border-[#042A2B] bg-white focus:outline-none focus:ring-2 focus:ring-[#042A2B]"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="email"
            className="block text-[#042A2B] font-semibold mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg border text-[#042A2B] border-[#042A2B] bg-white focus:outline-none focus:ring-2 focus:ring-[#042A2B]"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-bold text-[#F4E04D] bg-[#042A2B] hover:bg-[#063d3f] transition-all"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
