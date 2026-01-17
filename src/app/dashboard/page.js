"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentsForm from "@/components/StudentsForm";
import * as XLSX from 'xlsx'; // Excel export ke liye
import {
  Users, CheckCircle, AlertCircle, LayoutDashboard, History, Menu, X,
  PlusCircle, IndianRupee, Search, Trash2, FileText, LogOut, Bell, TrendingUp, Wallet, Download, SendHorizontal
} from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- STATES ---
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [selectedClass, setSelectedClass] = useState("ALL");





  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showFeeRequestModal, setShowFeeRequestModal] = useState(false);
  const [selectedStudentForRequest, setSelectedStudentForRequest] = useState(null);
  const [requestAmount, setRequestAmount] = useState("");


  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentsRes, feesRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/fees")
      ]);
      const sData = await studentsRes.json();
      const tData = await feesRes.json();
      setStudents(Array.isArray(sData) ? sData : []);
      setTransactions(Array.isArray(tData) ? tData : []);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to sync with database" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchData();
  }, [status, fetchData, router]);

  // --- ACTIONS ---

  // 1. EXCEL EXPORT
  const exportClassWiseExcel = () => {
    let filtered = students;

    if (selectedClass !== "ALL") {
      filtered = students.filter(s => s.class === selectedClass);
    }

    if (filtered.length === 0) {
      alert("No students found for selected class");
      return;
    }

    const dataToExport = filtered.map(s => ({
      "Roll No": s.rollNo,
      "Name": s.name,
      "Class": s.class,
      "Session": s.session,
      "Total Fees": s.totalFees,
      "Paid Fees": s.paidFees,
      "Balance": s.totalFees - s.paidFees,
      "Status": (s.totalFees - s.paidFees) <= 0 ? "Settled" : "Pending"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const fileName =
      selectedClass === "ALL"
        ? "All_Students_Fees_Report.xlsx"
        : `Class_${selectedClass}_Fees_Report.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };


  const handleRemoveStudent = async (id) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    try {
      const res = await fetch(`/api/students?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStudents(students.filter(s => s._id !== id));
        setMessage({ type: "success", text: "Student removed successfully" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Delete failed" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  // 2. BULK REQUEST WITH REPEAT CONTROL
  const sendBulkRequests = async () => {
    const pendingStudents = students.filter(s => {
      const balance = (s.totalFees || 0) - (s.paidFees || 0);
      return balance > 0 && s.isRequestSent !== true;
    });

    if (pendingStudents.length === 0) return alert("All requests already sent or no pending fees.");

    if (!confirm(`Send requests to ${pendingStudents.length} students?`)) return;

    setIsBulkSending(true);
    try {
      for (const student of pendingStudents) {
        await fetch("/api/fee-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: student._id, amount: student.totalFees - student.paidFees }),
        });
      }
      setMessage({ type: "success", text: "Bulk requests sent!" });
      fetchData();
    } catch (err) { setMessage({ type: "error", text: "Failed" }); }
    finally { setIsBulkSending(false); setTimeout(() => setMessage(null), 3000); }
  };

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
        setMessage({ type: "success", text: "Request sent!" });
        setShowFeeRequestModal(false);
        setRequestAmount("");
        fetchData();
      }
    } catch (err) { setMessage({ type: "error", text: "Failed to send" }); }
    setTimeout(() => setMessage(null), 3000);
  };

  // --- DATA CALCULATIONS ---
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNo.toString().includes(searchTerm)
  );

  const totalCollection = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalPending = students.reduce((sum, s) => sum + ((s.totalFees || 0) - (s.paidFees || 0)), 0);
  const totalExpected = totalCollection + totalPending;
  const collectionEfficiency = totalExpected > 0 ? Math.round((totalCollection / totalExpected) * 100) : 0;

  const paidCount = students.filter(s => (s.totalFees - s.paidFees) <= 0).length;
  const pendingCount = students.length - paidCount;

  const adminName = session?.user?.name || "Admin";
  const avatarLetter = adminName.charAt(0).toUpperCase();

  if (status === "loading" || isLoading) return <div className="h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-400 font-bold tracking-widest uppercase text-sm">Loading System Data...</div>;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-72" : "w-16 lg:w-20"} bg-[#0F172A] text-slate-300 transition-all duration-300 flex flex-col shadow-2xl z-50 sticky top-0 h-screen overflow-hidden`}>
        <div className="p-4 lg:p-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
          <div className="mx-auto lg:mx-0">
            <img src="https://png.pngtree.com/png-clipart/20211017/original/pngtree-school-logo-png-image_6851480.png" alt="School Logo" className="w-10 h-10 rounded-full object-cover" />
          </div>
          {sidebarOpen && <h1 className="font-bold text-white text-lg tracking-tight truncate">Admin Fees system</h1>}
        </div>
        <nav className="flex-1 p-2 lg:p-4 mt-4 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "students", label: "Students", icon: Users },
            { id: "transactions", label: "Transactions", icon: History },
            { id: "summary", label: "Fees Summary", icon: FileText },
          ].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSearchTerm(""); }} className={`w-full flex items-center ${sidebarOpen ? "px-4 justify-start" : "justify-center"} py-3.5 rounded-xl transition-all ${activeTab === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-slate-800 hover:text-white"}`}>
              <item.icon size={20} /> {sidebarOpen && <span className="font-medium ml-4">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 mt-auto">
          <button onClick={() => signOut()} className={`flex items-center ${sidebarOpen ? "px-4 justify-start" : "justify-center"} py-3 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold`}><LogOut size={20} /> {sidebarOpen && <span className="ml-4">Logout</span>}</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-2 lg:gap-4 flex-1">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Menu size={22} /></button>
            {(activeTab === "students" || activeTab === "transactions") && (
              <div className="relative w-full max-w-[180px] sm:max-w-md ml-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span></button>
            <div className="flex items-center gap-3 pl-3 lg:pl-6 border-l">
              <div className="text-right hidden md:block"><p className="text-sm font-bold text-slate-900 leading-none">{adminName}</p><p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Admin</p></div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">{avatarLetter}</div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
              {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />} <span className="text-sm font-semibold">{message.text}</span>
            </div>
          )}

          {/* TAB CONTENT: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={Users} color="indigo" label="Total Students" value={students.length} />
                <StatCard icon={IndianRupee} color="emerald" label="Total Collection" value={`₹${totalCollection.toLocaleString()}`} />
                <StatCard icon={AlertCircle} color="rose" label="Pending Amount" value={`₹${totalPending.toLocaleString()}`} />
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={18} className="text-indigo-600" /> Recent Transactions</h3><button onClick={() => setActiveTab("transactions")} className="text-indigo-600 text-sm font-bold hover:underline">View All</button></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                      <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Student</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 5).map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-semibold text-slate-700">{t.studentName}</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">₹{t.amount}</td>
                          <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Paid</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: STUDENTS */}
          {activeTab === "students" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b flex flex-wrap gap-4 justify-between items-center bg-white">
                <h2 className="text-xl font-bold text-slate-800">Student Directory</h2>
                <div className="flex gap-2">

                  <button onClick={sendBulkRequests} disabled={isBulkSending} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"><SendHorizontal size={18} /> {isBulkSending ? "Sending..." : "Send All Requests"}</button>
                  <button
                    onClick={() => {
                      setSelectedStudentForEdit(null);   // ✅ ADD THIS
                      setShowAddStudentModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
                  >
                    <PlusCircle size={18} /> Add Student
                  </button>

                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                    <tr><th className="px-6 py-4 text-left">Student Info</th><th className="px-6 py-4 text-center">Class</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Balance</th><th className="px-6 py-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => {
                      const balance = (s.totalFees || 0) - (s.paidFees || 0);
                      return (
                        <tr key={s._id} className="hover:bg-slate-50 group transition-all">
                          <td className="px-6 py-5">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">
                                {s.name.charAt(0)}
                              </div>

                              <div className="flex-1">
                                {/* STUDENT NAME (CLICKABLE) */}
                                <p
                                  className="font-bold text-slate-800 leading-tight cursor-pointer hover:underline"
                                  onClick={() =>
                                    setExpandedStudentId(
                                      expandedStudentId === s._id ? null : s._id
                                    )
                                  }
                                >
                                  {s.name}
                                </p>

                                {s.isRequestSent && (
                                  <span className="text-[9px] text-indigo-500 font-bold uppercase">
                                    Requested
                                  </span>
                                )}

                                {/* TOGGLE DETAILS */}
                                {expandedStudentId === s._id && (
                                  <div className="mt-2 text-xs text-slate-600 space-y-1">
                                    <p>
                                      <span className="font-semibold">Roll No:</span> {s.rollNo}
                                    </p>
                                    <p>
                                      <span className="font-semibold mt-2">Session:</span> {s.session}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center font-bold text-slate-600 text-sm">{s.class}</td>
                          <td className="px-6 py-5 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${balance <= 0 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>{balance <= 0 ? "Settled" : "Pending"}</span></td>
                          <td className="px-6 py-5 text-right font-black text-slate-900">₹{balance}</td>
                          <td className="px-6 py-5 text-right space-x-2">

                            {/* EDIT STUDENT */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentForEdit(s);
                                setShowAddStudentModal(true);
                              }}
                              className="p-2 text-indigo-500 hover:text-indigo-700"
                              title="Edit Student"
                            >
                              ✏️
                            </button>

                            {/* REQUEST */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentForRequest(s);
                                setShowFeeRequestModal(true);
                              }}
                              disabled={balance <= 0 || s.isRequestSent === true}
                              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all${balance <= 0 || s.isRequestSent === true
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                                }`}
                            >
                              {s.isRequestSent ? "Sent" : "Request"}
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveStudent(s._id);
                              }}
                              className="p-2 text-slate-300 hover:text-red-500"
                              title="Delete Student"
                            >
                              <Trash2 size={16} />
                            </button>

                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: TRANSACTIONS (Pura code restore kiya h) */}
          {activeTab === "transactions" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">Transaction History</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Student</th><th className="px-6 py-4">Mode</th><th className="px-6 py-4 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.filter(t => t.studentName.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">{t._id.slice(-6).toUpperCase()}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{t.studentName}</td>
                        <td className="px-6 py-4"><span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-black text-slate-600 uppercase">{t.paymentMode || "Paid"}</span></td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600">₹{t.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: SUMMARY (Visual Graphic) */}
          {activeTab === "summary" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm text-center">
                <h3 className="text-lg font-black text-slate-800 mb-8">Collection Efficiency</h3>
                <div className="relative inline-block">
                  <svg className="w-48 h-48 transform -rotate-90"><circle cx="96" cy="96" r="80" stroke="#f1f5f9" strokeWidth="16" fill="transparent" /><circle cx="96" cy="96" r="80" stroke="#4f46e5" strokeWidth="16" fill="transparent" strokeDasharray={502} strokeDashoffset={502 - (502 * collectionEfficiency) / 100} strokeLinecap="round" /></svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-slate-800"><span className="text-4xl">{collectionEfficiency}%</span><span className="text-[10px] uppercase text-slate-400">Collected</span></div>
                </div>
              </div>
              <div className="bg-[#0F172A] p-8 rounded-[2rem] text-white space-y-6">
                <h3 className="text-lg font-bold">Quick Insights</h3>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-slate-400 text-xs font-bold uppercase">Pending Students</p><p className="text-2xl font-black text-amber-400">{pendingCount}</p></div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10"><p className="text-slate-400 text-xs font-bold uppercase">Settled Accounts</p><p className="text-2xl font-black text-emerald-400">{paidCount}</p></div>
              </div>
              {/* ===== CLASS WISE EXCEL EXPORT ===== */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8">
                <h3 className="text-lg font-black text-slate-800 mb-4">
                  📊 Class-wise Student Excel Export
                </h3>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  {/* CLASS SELECT */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Select Class
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="mt-1 block w-48 rounded-xl border border-slate-200 p-3 bg-slate-50 font-bold"
                    >
                      <option value="ALL">All Classes</option>
                      <option value="8th">8th</option>
                      <option value="9th">9th</option>
                      <option value="10th">10th</option>
                      <option value="11th">11th</option>
                      <option value="12th">12th</option>
                    </select>
                  </div>

                  {/* DOWNLOAD BUTTON */}
                  <button
                    onClick={exportClassWiseExcel}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
                  >
                    <Download size={18} />
                    Download Excel
                  </button>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {showAddStudentModal && (
        <StudentsForm
          key={selectedStudentForEdit?._id || "new"}   // ✅ ADD THIS
          student={selectedStudentForEdit}
          onClose={() => {
            setShowAddStudentModal(false);
            setSelectedStudentForEdit(null);
            fetchData();
          }}
        />
      )}


      {showFeeRequestModal && selectedStudentForRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Create Request</h3>
            <p className="text-slate-400 text-sm mb-8">Student: {selectedStudentForRequest.name}</p>
            <input type="number" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent p-5 rounded-2xl mb-8 focus:border-indigo-500 outline-none text-2xl font-black" placeholder="0.00" autoFocus />
            <div className="flex gap-4"><button onClick={() => setShowFeeRequestModal(false)} className="flex-1 py-4 font-bold text-slate-400">Cancel</button><button onClick={sendFeeRequest} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl">Send Now</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-600", emerald: "bg-emerald-50 text-emerald-600", rose: "bg-rose-50 text-rose-600" };
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-center gap-6">
      <div className={`${colors[color]} p-4 rounded-2xl`}><Icon size={28} /></div>
      <div><p className="text-slate-400 text-xs font-black uppercase mb-1">{label}</p><p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p></div>
    </div>
  );
}