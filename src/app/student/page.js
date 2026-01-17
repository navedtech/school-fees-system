"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle, LogOut, LayoutDashboard, UserCircle,
  ReceiptIndianRupee, BellRing, Menu, X, CreditCard, Landmark, Send, History, Download
} from "lucide-react";

// --- FIXED IMPORTS ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [feeRequests, setFeeRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");


  const [showBankForm, setShowBankForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [manualBankDetails, setManualBankDetails] = useState({
    studentBankName: "",
    accountNumber: "",
    transactionId: ""
  });

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("student");
    if (!stored) {
      window.location.href = "/student/login";
      return;
    }
    try {
      const parsed = JSON.parse(stored);
            // 🔥 ALWAYS FETCH LATEST STUDENT FROM DB
      fetch(`/api/students`)
        .then(res => res.json())
        .then(allStudents => {
          const freshStudent = allStudents.find(
            s => String(s._id) === String(parsed._id)
          );

          if (!freshStudent) {
            localStorage.removeItem("student");
            window.location.href = "/student/login";
            return;
          }

          setStudent(freshStudent);

          // ✅ update localStorage also
          localStorage.setItem("student", JSON.stringify(freshStudent));
        });
    } catch (err) {
      window.location.href = "/student/login";
    }
  }, []);

  const fetchData = async () => {
    if (!student?._id) return;
    try {
      const [reqRes, transRes] = await Promise.all([
        fetch(`/api/fee-request?studentId=${student._id}`),
        fetch(`/api/fees?studentId=${student._id}`)
      ]);
      const reqData = await reqRes.json();
      const transData = await transRes.json();
      const myTransactions = Array.isArray(transData) ? transData.filter(t => String(t.studentId) === String(student._id)) : [];
      setTransactions(myTransactions);
      setFeeRequests(Array.isArray(reqData) ? reqData : []);

    } catch (err) {
      console.error("Fetch error");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [student]);

  // --- FIXED PDF GENERATOR ---
  const downloadSlip = (t) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(63, 81, 181); // Indigo
    doc.text("FEES PAYMENT RECEIPT", 105, 20, { align: "center" });

    // Details
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`Student Name: ${student.name}`, 20, 40);
    doc.text(`Roll No: ${student.rollNo}`, 20, 50);
    doc.text(`Class: ${student.class}`, 20, 60);

    // Table - Using the correct function call
    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Transaction ID', 'Mode', 'Amount']],
      body: [[
        new Date(t.date).toLocaleDateString(),
        t._id.slice(-8).toUpperCase(),
        t.paymentMode || "Paid",
        `Rs. ${t.amount}`
      ]],
      headStyles: { fillColor: [63, 81, 181] },
      theme: 'grid'
    });

    doc.save(`Receipt_${t._id.slice(-5)}.pdf`);
  };

  const handlePay = async (requestId, mode, extraDetails = {}) => {
    try {
      const res = await fetch("/api/fee-request/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, paymentMode: mode, ...extraDetails }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Success: Paid via ${mode}`);
        fetchData();
        setShowBankForm(false);
        setManualBankDetails({ studentBankName: "", accountNumber: "", transactionId: "" });
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) { alert("Payment error"); }
  };

  if (!mounted || !student) return null;

  const logout = () => {
    localStorage.removeItem("student");
    window.location.href = "/student/login";
  };
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* SIDEBAR - Exactly as before */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#0f172a] transition-all duration-300 flex flex-col shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-800 bg-[#1e293b]">
          <img src="https://png.pngtree.com/png-clipart/20211017/original/pngtree-school-logo-png-image_6851480.png" alt="Logo" className="w-10 h-10 rounded-full" />
          {isSidebarOpen && <h1 className="font-bold text-white text-lg truncate tracking-widest">School Portal</h1>}
        </div>
        <nav className="flex-1 mt-6 px-3 space-y-2 text-white">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-4 p-3 rounded-xl ${activeTab === "dashboard" ? "bg-indigo-600" : "text-slate-400 hover:bg-slate-800"}`}><LayoutDashboard size={20} /> {isSidebarOpen && "Dashboard"}</button>
          <button onClick={() => setActiveTab("details")} className={`w-full flex items-center gap-4 p-3 rounded-xl ${activeTab === "details" ? "bg-indigo-600" : "text-slate-400 hover:bg-slate-800"}`}><UserCircle size={20} /> {isSidebarOpen && "Details"}</button>
          <button onClick={() => setActiveTab("fees")} className={`w-full flex items-center gap-4 p-3 rounded-xl ${activeTab === "fees" ? "bg-indigo-600" : "text-slate-400 hover:bg-slate-800"}`}><ReceiptIndianRupee size={20} /> {isSidebarOpen && "Fees"}</button>
          <button onClick={() => setActiveTab("notice")} className={`w-full flex items-center gap-4 p-3 rounded-xl ${activeTab === "notice" ? "bg-indigo-600" : "text-slate-400 hover:bg-slate-800"}`}><BellRing size={20} /> {isSidebarOpen && "Notice"}</button>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={logout} className="flex items-center gap-4 w-full p-3 text-red-400 hover:bg-red-500/10 rounded-xl"><LogOut size={20} /> {isSidebarOpen && "Logout"}</button></div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
          <div className="font-bold text-slate-800">Welcome, {student.name}</div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {message && <div className="mb-4 bg-green-500 text-white p-3 rounded-lg text-center font-bold">{message}</div>}

            {activeTab === "dashboard" && (
              <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl">
                <h2 className="text-2xl font-bold italic">Student Dashboard</h2>
                <p className="mt-2 opacity-80">Check your fees and notices here.</p>
              </div>
            )}
            {activeTab === "details" && (
              <div className="space-y-6">

                {/* Header Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-3xl text-white shadow-lg">
                  <h2 className="text-2xl font-black">Student Profile</h2>
                  <p className="opacity-80 mt-1">Personal & academic details</p>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Personal Info */}
                  <div className="bg-white p-6 rounded-3xl shadow border">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">👤 Personal Information</h3>
                    <div className="space-y-3 text-sm">
                      <p className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Name</span>
                        <span className="font-bold">{student.name}</span>
                      </p>
                      <p className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Email</span>
                        <span className="font-bold">{student.email || "N/A"}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Role</span>
                        <span className="font-bold capitalize">{student.role || "Student"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Academic Info */}
                  <div className="bg-white p-6 rounded-3xl shadow border">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">🎓 Academic Information</h3>
                    <div className="space-y-3 text-sm">
                      <p className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Class</span>
                        <span className="font-bold">{student.class}</span>
                      </p>
                      <p className="flex justify-between border-b pb-2">
                        <span className="text-slate-500">Roll No</span>
                        <span className="font-bold">{student.rollNo}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Session</span>
                        <span className="font-bold"> {student.session}</span>
                      </p>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-white p-6 rounded-3xl shadow border">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">🔐 Account Status</h3>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        Active Account
                      </span>
                      <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                        Fees Enabled
                      </span>
                      <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                        Verified Student
                      </span>
                    </div>
                  </div>

                  {/* Quick Summary */}
                  <div className="bg-white p-6 rounded-3xl shadow border">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">📊 Quick Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-indigo-50 rounded-2xl">
                        <p className="text-xs text-slate-500">Total Payments</p>
                        <p className="text-xl font-black text-indigo-600">{transactions.length}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-2xl">
                        <p className="text-xs text-slate-500">Pending Fees</p>
                        <p className="text-xl font-black text-green-600">{feeRequests.length}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}


            {activeTab === "fees" && (
              <div className="space-y-6">
                {/* Pending Fees Section */}
                <div className="bg-white rounded-3xl shadow-lg border overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b font-bold uppercase text-xs tracking-widest">Pending Requests</div>
                  <div className="p-6 space-y-4">
                    {feeRequests.length === 0 ? <p className="text-center text-slate-400 italic">No pending fees.</p> : (
                      feeRequests.map(req => (
                        <div key={req._id} className="flex justify-between items-center p-5 border rounded-2xl bg-slate-50">
                          <div><p className="text-2xl font-black">₹{req.amount}</p><p className="text-xs text-red-600 font-bold uppercase">{req.status}</p></div>
                          <div className="flex gap-2">
                            <button onClick={() => handlePay(req._id, "UPI")} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow hover:bg-green-700">Pay UPI</button>
                            <button onClick={() => { setSelectedRequestId(req._id); setShowBankForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow hover:bg-indigo-700">Bank Transfer</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* --- History Section (Directly under pending fees) --- */}
                <div className="bg-white rounded-3xl shadow-lg border overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b font-bold flex items-center gap-2 tracking-widest uppercase text-xs text-indigo-600"><History size={16} /> Transaction History</div>
                  <div className="p-6">
                    {transactions.length === 0 ? <p className="text-center text-slate-400 italic">No previous payments.</p> : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead><tr className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b"><th className="pb-3">Date</th><th className="pb-3">Amount</th><th className="pb-3 text-right">Receipt</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {transactions.map(t => (
                              <tr key={t._id}>
                                <td className="py-4 text-sm font-bold text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="py-4 font-black text-slate-800">₹{t.amount}</td>
                                <td className="py-4 text-right"><button onClick={() => downloadSlip(t)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Download size={18} /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notice" && <div className="bg-white p-6 rounded-3xl shadow border"><h2 className="text-xl font-bold mb-4 text-orange-600">Notice Board</h2><div className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded">Check back later for school updates!</div></div>}
          </div>
        </main>
      </div>

      {/* BANK FORM MODAL - Same logic as manual entry */}
      {showBankForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center"><h3 className="text-xl font-bold flex items-center gap-2"><Landmark size={20} /> Enter Bank Details</h3><button onClick={() => setShowBankForm(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button></div>
            <div className="p-8 space-y-4">
              <input type="text" placeholder="Your Bank Name" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 p-4 rounded-2xl outline-none font-bold" value={manualBankDetails.studentBankName} onChange={(e) => setManualBankDetails({ ...manualBankDetails, studentBankName: e.target.value })} />
              <input type="text" placeholder="Account Number" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 p-4 rounded-2xl outline-none font-bold" value={manualBankDetails.accountNumber} onChange={(e) => setManualBankDetails({ ...manualBankDetails, accountNumber: e.target.value })} />
              <input type="text" placeholder="UTR / Transaction ID" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 p-4 rounded-2xl outline-none font-bold" value={manualBankDetails.transactionId} onChange={(e) => setManualBankDetails({ ...manualBankDetails, transactionId: e.target.value })} />
              <button onClick={() => handlePay(selectedRequestId, "Bank", manualBankDetails)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2"><Send size={18} /> Submit Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}