"use client";
import React, { useState } from "react";

/**
 * Handles user login and registration, managing state locally.
 * Upon successful login, calls onLoginSuccess with the user's email.
 */
export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const endpoint = isLogin ? "http://127.0.0.1:8000/api/login" : "http://127.0.0.1:8000/api/signup";
    
    // Construct the payload based on whether we are logging in or signing up
    const bodyData = isLogin 
      ? JSON.stringify({ email, password })
      : JSON.stringify({ name, email, password });

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: bodyData,
      });

      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          // Success: Store email as the session identifier
          localStorage.setItem("user_email", data.email);
          alert("Login successful! Redirecting to homepage.");
        
        } else {
          // Success: Signed up, now prompt them to log in
          alert(data.message + " Please log in now.");
          setIsLogin(true);
          setName("");
          setPassword("");
        }
      } else {
        alert(data.detail || data.message || "Authentication failed!");
      }

    } catch (err) {
      console.error("Auth Error:", err);
      alert("Network or server error. Check your FastAPI connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#042A2B] font-sans">
      <form onSubmit={handleSubmit} className="bg-[#F4E04D] rounded-2xl shadow-2xl p-8 w-full max-w-md transition-all duration-300">
        <h1 className="text-3xl font-bold text-[#042A2B] text-center mb-6">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        
        {/* Name Field (Only for Signup) */}
        {!isLogin && (
          <div className="mb-4">
            <label htmlFor="name" className="block text-[#042A2B] font-semibold mb-2">Name</label>
            <input 
              type="text" 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="w-full p-3 rounded-lg border text-[#042A2B] border-[#042A2B] bg-white focus:outline-none focus:ring-2 focus:ring-[#042A2B]" 
            />
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-[#042A2B] font-semibold mb-2">Email</label>
          <input 
            type="email" 
            id="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="w-full p-3 rounded-lg border text-[#042A2B] border-[#042A2B] bg-white focus:outline-none focus:ring-2 focus:ring-[#042A2B]" 
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-[#042A2B] font-semibold mb-2">Password</label>
          <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="w-full p-3 rounded-lg border text-[#042A2B] border-[#042A2B] bg-white focus:outline-none focus:ring-2 focus:ring-[#042A2B]" 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-3 rounded-lg font-bold text-[#F4E04D] bg-[#042A2B] hover:bg-[#063d3f] transition-all disabled:opacity-50"
        >
          {isLoading ? "Processing..." : isLogin ? "Login" : "Register"}
        </button>
        
        <p 
          className="mt-4 text-center text-sm cursor-pointer text-[#042A2B] hover:text-[#063d3f]"
          onClick={() => {
            setIsLogin(!isLogin);
            setEmail("");
            setPassword("");
            setName("");
          }}
        >
          {isLogin ? "Need an account? Sign Up" : "Already have an account? Log In"}
        </p>
      </form>
    </div>
  );
}