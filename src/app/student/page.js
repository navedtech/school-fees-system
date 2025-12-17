"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, LogOut } from "lucide-react";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [feeRequests, setFeeRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  // ✅ Fix hydration + auth check
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("student");

    if (!stored) {
      window.location.href = "/student/login";
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed?._id) {
        localStorage.removeItem("student");
        window.location.href = "/student/login";
        return;
      }
      setStudent(parsed);
    } catch (err) {
      localStorage.removeItem("student");
      window.location.href = "/student/login";
    }
  }, []);

  // ✅ Polling fee requests every 3 seconds
  useEffect(() => {
    if (!student?._id) return;

    const fetchFeeRequests = async () => {
      try {
        const res = await fetch(`/api/fee-request?studentId=${student._id}`);
        const data = await res.json();
        setFeeRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        setFeeRequests([]);
      }
    };

    fetchFeeRequests(); // initial fetch
    const interval = setInterval(fetchFeeRequests, 3000); // every 3s
    return () => clearInterval(interval);
  }, [student]);

  const handlePay = async (requestId, mode) => {
    const res = await fetch("/api/fee-request/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, paymentMode: mode }),
    });

    if (res.ok) {
      setMessage("Fee submitted successfully");
      setFeeRequests(prev =>
        prev.map(r =>
          r._id === requestId ? { ...r, status: "paid" } : r
        )
      );

      // auto-hide success message after 3 sec
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const logout = () => {
    localStorage.removeItem("student");
    window.location.href = "/student/login";
  };

  if (!mounted || !student) return null;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">
              Welcome, {student.name}
            </h1>
            <p className="text-sm text-slate-600">
              Class: {student.class} | Roll No: {student.rollNo}
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Success message */}
        {message && (
          <div className="bg-green-100 text-green-700 p-4 rounded flex gap-2">
            <CheckCircle /> {message}
          </div>
        )}

        {/* Fee Requests */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Fee Requests</h2>

          {feeRequests.length === 0 ? (
            <p className="text-slate-500">No fee requests from admin.</p>
          ) : (
            <div className="space-y-4">
              {feeRequests.map(req => (
                <div
                  key={req._id}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">Amount: ₹{req.amount}</p>
                    <p className="text-sm text-slate-500">
                      Status:{" "}
                      <span
                        className={
                          req.status === "paid" ? "text-green-600" : "text-red-600"
                        }
                      >
                        {req.status}
                      </span>
                    </p>
                  </div>

                  {req.status?.toLowerCase() === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePay(req._id, "UPI")}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Pay UPI
                      </button>
                      <button
                        onClick={() => handlePay(req._id, "Bank")}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Pay Bank
                      </button>
                    </div>
                  ) : (
                    <CheckCircle className="text-green-600" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
