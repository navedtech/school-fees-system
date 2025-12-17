"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Next.js 13+ navigation
import UserMenu from "@/components/UserMenu";
import StudentsForm from "@/components/StudentsForm";

import {
  Users,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  History,
  Menu,
  X,
  PlusCircle,
  IndianRupee,
} from "lucide-react";

export default function SchoolFeesApp() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Modal States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showFeeRequestModal, setShowFeeRequestModal] = useState(false);
  const [selectedStudentForRequest, setSelectedStudentForRequest] = useState(null);
  const [requestAmount, setRequestAmount] = useState("");

  // --- 1. DATA FETCHING LOGIC (Perfectly Synced) ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Dono API ko ek sath call kar rahe hain
      const [studentsRes, feesRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/fees")
      ]);
      
      const sData = await studentsRes.json();
      const tData = await feesRes.json();
      
      // Console logs debugging ke liye (Check terminal if data is coming)
      console.log("Fetched Students:", sData);
      console.log("Fetched Transactions:", tData);

      // Data format handling: Array check zaroori hai
      setStudents(Array.isArray(sData) ? sData : []);
      setTransactions(Array.isArray(tData) ? tData : []);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setMessage({ type: "error", text: "Failed to load data from server" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 2. AUTHENTICATION & INITIAL FETCH ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, fetchData, router]);

  // --- 3. FEE REQUEST LOGIC ---
  const sendFeeRequest = async () => {
    if (!requestAmount || !selectedStudentForRequest) return;
    try {
      const res = await fetch("/api/fee-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentForRequest._id,
          amount: Number(requestAmount),
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Fee request sent successfully!" });
        setShowFeeRequestModal(false);
        setRequestAmount("");
        fetchData(); // Refresh data
      }
    } catch (err) {
      setMessage({ type: "error", text: "Request failed" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // --- 4. CALCULATIONS ---
  const totalCollection = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPending = students.reduce((sum, s) => sum + ((s.totalFees || 0) - (s.paidFees || 0)), 0);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center font-bold text-indigo-600 animate-pulse">Loading Dashboard Data...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-400">Fees System</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full p-3 rounded-xl flex items-center gap-3 ${activeTab === "dashboard" ? "bg-indigo-600 shadow-lg shadow-indigo-500/20" : "hover:bg-slate-800"}`}><LayoutDashboard size={20} /> Dashboard</button>
          <button onClick={() => setActiveTab("students")} className={`w-full p-3 rounded-xl flex items-center gap-3 ${activeTab === "students" ? "bg-indigo-600" : "hover:bg-slate-800"}`}><Users size={20} /> Students</button>
          <button onClick={() => setActiveTab("transactions")} className={`w-full p-3 rounded-xl flex items-center gap-3 ${activeTab === "transactions" ? "bg-indigo-600" : "hover:bg-slate-800"}`}><History size={20} /> Transactions</button>
        </nav>
        <div className="p-4 border-t border-slate-800"><UserMenu /></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="mb-6 bg-white p-2 rounded-lg shadow"><Menu /></button>}

        {message && (
          <div className={`mb-6 p-4 rounded-xl font-medium ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{message.text}</div>
        )}

        {/* DASHBOARD CARDS */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="bg-indigo-100 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 mb-4"><Users size={24}/></div>
                <p className="text-slate-500 text-sm font-semibold">Total Students</p>
                <p className="text-3xl font-black">{students.length}</p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 mb-4"><IndianRupee size={24}/></div>
                <p className="text-slate-500 text-sm font-semibold">Total Collection</p>
                <p className="text-3xl font-black text-green-600">₹{totalCollection.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="bg-red-100 w-12 h-12 rounded-2xl flex items-center justify-center text-red-600 mb-4"><AlertCircle size={24}/></div>
                <p className="text-slate-500 text-sm font-semibold">Pending Fees</p>
                <p className="text-3xl font-black text-red-600">₹{totalPending.toLocaleString()}</p>
              </div>
            </div>

            {/* QUICK VIEW TABLE */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold flex items-center gap-2"><History className="text-indigo-600"/> Recent Transactions</h2>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4 text-center">Date</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4 text-center">Amount</th>
                        <th className="px-6 py-4 text-center">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 10).map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-center text-sm">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{t.studentName}</td>
                          <td className="px-6 py-4 text-center font-black text-green-600">₹{t.amount}</td>
                          <td className="px-6 py-4 text-center text-sm font-medium"><span className="bg-slate-100 px-3 py-1 rounded-full">{t.paymentMode}</span></td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr><td colSpan="4" className="text-center py-10 text-slate-400">No transactions found yet.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === "students" && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <h2 className="text-lg font-bold">Manage Students</h2>
                <button onClick={() => setShowAddStudentModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"><PlusCircle size={18}/> Add Student</button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Student Info</th>
                      <th className="px-6 py-4 text-center">Class</th>
                      <th className="px-6 py-4 text-right">Balance Due</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 leading-none">{s.name}</p>
                          <small className="text-slate-400 font-medium">Roll: {s.rollNo}</small>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/30">{s.class}</td>
                        <td className="px-6 py-4 text-right font-black text-red-600">₹{(s.totalFees || 0) - (s.paidFees || 0)}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => { setSelectedStudentForRequest(s); setShowFeeRequestModal(true); }} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-600 transition-all">Request Fee</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {/* FULL TRANSACTIONS TAB */}
        {activeTab === "transactions" && (
           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b bg-slate-50/50"><h2 className="text-lg font-bold">All Transactions</h2></div>
             <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold tracking-wider uppercase">
                    <tr>
                      <th className="px-6 py-4 text-center">Date</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4 text-center">Amount</th>
                      <th className="px-6 py-4 text-center">Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-center text-sm">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-bold">{t.studentName}</td>
                        <td className="px-6 py-4 text-center font-black text-green-600">₹{t.amount}</td>
                        <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{t.paymentMode}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </div>
        )}
      </main>

      {/* MODALS */}
      {showAddStudentModal && <StudentsForm onClose={() => { setShowAddStudentModal(false); fetchData(); }} />}
      {showFeeRequestModal && selectedStudentForRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setShowFeeRequestModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
            <h3 className="text-xl font-bold mb-1">Create Fee Request</h3>
            <p className="text-sm text-slate-500 mb-6 italic">Student: {selectedStudentForRequest.name}</p>
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Amount (₹)</label>
            <input type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className="w-full border-2 border-slate-100 p-4 rounded-2xl mb-6 focus:border-indigo-500 outline-none text-xl font-bold" placeholder="0.00" />
            <button onClick={sendFeeRequest} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Send Request</button>
          </div>
        </div>
      )}
    </div>
  );
}