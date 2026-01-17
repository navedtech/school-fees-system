"use client";
import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

export default function StudentsForm({ onClose, student = null }) {
  // ---------------- STATES ----------------
  const [name, setName] = useState(student?.name || "");
  const [rollNo, setRollNo] = useState(student?.rollNo || "");
  const [className, setClassName] = useState(student?.class || "");
  const [totalFees, setTotalFees] = useState(student?.totalFees || "");
  const [session, setSession] = useState(student?.session || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name || !rollNo || !className || !totalFees || !session) {
      setError("All fields including session are required");
      setLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      rollNo: rollNo.trim(),
      class: className,
      session: session.trim(),
      totalFees: Number(totalFees),
    };

    // ✅ EDIT CASE (MOST IMPORTANT FIX)
    if (student?._id) {
      payload._id = student._id;
      payload.paidFees = student.paidFees || 0; // 👈 KEEP OLD PAID FEES
    }

    try {
      const response = await fetch("/api/students", {
        method: student?._id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to save student");
        setLoading(false);
        return;
      }

      onClose(); // dashboard refresh करेगा
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative">

        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          {student ? "✏️ Edit Student" : "👤 Add New Student"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student Name"
            className="w-full p-3 border rounded-xl"
            required
          />

          <input
            type="text"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            placeholder="Roll No"
            className="w-full p-3 border rounded-xl"
            required
          />

          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full p-3 border rounded-xl"
            required
          >
            <option value="">Select Class</option>
            <option value="8th">8th</option>
            <option value="9th">9th</option>
            <option value="10th">10th</option>
            <option value="11th">11th</option>
            <option value="12th">12th</option>
          </select>

          {/* SESSION */}
          <input
            type="text"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="Session (2024-25)"
            className="w-full p-3 border rounded-xl"
            required
          />

          <input
            type="number"
            value={totalFees}
            onChange={(e) => setTotalFees(e.target.value)}
            placeholder="Total Fees"
            className="w-full p-3 border rounded-xl"
            required
          />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Save Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
