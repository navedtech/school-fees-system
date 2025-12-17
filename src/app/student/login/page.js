"use client";
import React, { useState } from "react";

export default function StudentLogin() {
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          rollNo: rollNo,
          class: studentClass,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Data save karein aur redirect karein
        localStorage.setItem("student", JSON.stringify(data.student));
        window.location.href = "/student"; 
      } else {
        setError(data.message || "Invalid Details");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Student Login</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

        <div className="space-y-4">
          <input 
            type="text" placeholder="Full Name" required 
            className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={name} onChange={(e) => setName(e.target.value)}
          />
          <input 
            type="text" placeholder="Roll Number" required 
            className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={rollNo} onChange={(e) => setRollNo(e.target.value)}
          />
          <select 
            required className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={studentClass} onChange={(e) => setStudentClass(e.target.value)}
          >
            <option value="">Select Class</option>
            <option value="8th">8th</option>
            <option value="9th">9th</option>
            <option value="10th">10th</option>
            <option value="11th">11th</option>
            <option value="12th">12th</option>
          </select>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}