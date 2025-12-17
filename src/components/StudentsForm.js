"use client";
import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

export default function StudentsForm({ onClose, student = null }) {
  // States
  const [name, setName] = useState(student?.name || "");
  const [rollNo, setRollNo] = useState(student?.rollNo || "");
  const [className, setClassName] = useState(student?.class || "");
  const [totalFees, setTotalFees] = useState(student?.totalFees || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Data validation (Double check)
    if (!name || !rollNo || !className || !totalFees) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          rollNo: rollNo.trim(),
          class: className,
          totalFees: Number(totalFees),
          paidFees: 0, // Naye student ke liye default 0
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success: Dashboard refresh aur modal close
        onClose(); 
      } else {
        // Backend se aaya hua error message dikhana (e.g. Duplicate Roll No)
        setError(data.error || data.message || "Failed to save student");
      }
    } catch (err) {
      console.error("Error saving student:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {student ? "✏️ Edit Student" : "👤 Add New Student"}
        </h2>
        <p className="text-sm text-slate-500 mb-6">Enter student details to register them in the portal.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Student Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="e.g. Rahul Kumar"
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 transition-all" 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Roll Number</label>
            <input 
              type="text" 
              value={rollNo} 
              onChange={(e) => setRollNo(e.target.value)} 
              required 
              placeholder="e.g. 101"
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 transition-all" 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Assign Class</label>
            <select 
              value={className} 
              onChange={(e) => setClassName(e.target.value)} 
              required 
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 transition-all appearance-none"
            >
              <option value="">Select Class</option>
              <option value="8th">8th</option>
              <option value="9th">9th</option>
              <option value="10th">10th</option>
              <option value="11th">11th</option>
              <option value="12th">12th</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Yearly Fees (₹)</label>
            <input 
              type="number" 
              value={totalFees} 
              onChange={(e) => setTotalFees(e.target.value)} 
              required 
              placeholder="e.g. 15000"
              className="w-full border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 transition-all" 
            />
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> Saving...</>
              ) : (
                "Save Student"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}