"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react'; 
import { redirect } from 'next/navigation'; 
import UserMenu from '@/components/UserMenu'; 
import StudentsForm from '@/components/StudentsForm'; 
import { 
    LayoutDashboard, 
    Users, 
    IndianRupee, 
    History, 
    Menu, 
    X, 
    Plus, 
    Search, 
    Trash2, 
    CheckCircle,
    AlertCircle,
    Download,
    Loader2,
    ListRestart
} from 'lucide-react';


export default function SchoolFeesApp() {
    
    const { data: session, status } = useSession(); 
    
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [students, setStudents] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showPayFeeModal, setShowPayFeeModal] = useState(false);
    const [selectedStudentForFee, setSelectedStudentForFee] = useState(null);
    const [message, setMessage] = useState(null);

    const [newStudent, setNewStudent] = useState({ name: '', class: '', rollNo: '', parentName: '', contact: '', totalFees: '' });
    const [feeAmount, setFeeAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchWithRetry = useCallback(async (url, options = {}, retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.status === 429) { 
                    const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `API error: ${response.status}`);
                }
                return response;
            } catch (e) {
                if (i === retries - 1) throw e;
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }, []);


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const studentsRes = await fetchWithRetry('/api/students', { cache: 'no-store' });
            const studentsData = await studentsRes.json();
            setStudents(studentsData);

            const transactionsRes = await fetchWithRetry('/api/fees', { cache: 'no-store' });
            const transactionsData = await transactionsRes.json();
            setTransactions(transactionsData);

        } catch (err) {
            setError(err.message);
            console.error("Data Fetching Error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchWithRetry]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const totalCollection = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPending = students.reduce((acc, curr) => acc + (curr.totalFees - curr.paidFees), 0);
    const totalStudentsCount = students.length;

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toString().includes(searchTerm)
    );


    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
                <span className="ml-3 text-lg text-slate-700">Authorizing...</span>
            </div>
        );
    }
    
    if (status === 'unauthenticated') {
        redirect('/login');
        return null; 
    }


    const handleAddStudent = async (e) => {
        e.preventDefault();
        setMessage(null);
        try {
            const res = await fetchWithRetry('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStudent),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Error Student Add.');
            }

            setMessage({ type: 'success', text: 'New student add succefully !' });
            setShowAddStudentModal(false);
            setNewStudent({ name: '', class: '', rollNo: '', parentName: '', contact: '', totalFees: '' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handlePayFee = async (e) => {
        e.preventDefault();
        setMessage(null);
        if (!selectedStudentForFee || !feeAmount) return;

        const amount = Number(feeAmount);
        const due = selectedStudentForFee.totalFees - selectedStudentForFee.paidFees;

        if (amount <= 0 || amount > due) {
            setMessage({ type: 'error', text: `Sahi amount (₹1 se ₹${due.toLocaleString('en-IN')} tak) daalein.` });
            return;
        }

        try {
            const res = await fetchWithRetry('/api/fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudentForFee._id,
                    amount: amount,
                    paymentMode: paymentMode
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Fee payment record nahi ho paya.');
            }

            setMessage({ type: 'success', text: `₹${amount.toLocaleString('en-IN')} fee Submited Succefully!` });
            setShowPayFeeModal(false);
            setFeeAmount('');
            setSelectedStudentForFee(null);
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const deleteStudent = async (studentId, studentName) => {
        setMessage(null);
        
        if (!window.confirm(`Are You Delete ${studentName} ?`)) {
            return;
        }

        try {
            const res = await fetchWithRetry(`/api/students?id=${studentId}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Student not delete');
            }

            setMessage({ type: 'success', text: 'Student delete succefully.' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    
    const Sidebar = () => (
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
            <div className="p-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-indigo-400">Fees Portal</h1>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
                    <X size={24} />
                </button>
            </div>
            <nav className="mt-6">
                <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" id="dashboard" />
                <NavItem icon={<Users size={20} />} label="Students" id="students" />
                <NavItem icon={<IndianRupee size={20} />} label="Fee Collection" id="fees" />
                <NavItem icon={<History size={20} />} label="Transactions" id="transactions" />
            </nav>
            <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
                <UserMenu />
            </div>
        </div>
    );

    const NavItem = ({ icon, label, id }) => (
        <button 
            onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${activeTab === id ? 'bg-indigo-600 text-white border-r-4 border-indigo-300' : 'text-slate-300 hover:bg-slate-800'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    const StatCard = ({ title, value, icon, color }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
            <p className="text-slate-500 text-sm mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
            {icon}
            </div>
        </div>
    );
    
    const Alert = ({ message, type, onClose }) => (
        <div className={`p-4 rounded-lg flex items-center justify-between shadow-md ${type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
            <div className="flex items-center gap-3">
                {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-opacity-50 transition-colors">
                <X size={16} />
            </button>
        </div>
    );


    const renderDashboard = () => (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Students" 
                    value={totalStudentsCount} 
                    icon={<Users size={24} className="text-blue-600" />} 
                    color="bg-blue-100" 
                />
                <StatCard 
                    title="Total Collected" 
                    value={`₹${totalCollection.toLocaleString('en-IN')}`} 
                    icon={<CheckCircle size={24} className="text-green-600" />} 
                    color="bg-green-100" 
                />
                <StatCard 
                    title="Pending Fees" 
                    value={`₹${totalPending.toLocaleString('en-IN')}`} 
                    icon={<AlertCircle size={24} className="text-red-600" />} 
                    color="bg-red-100" 
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Recent Transactions (New Collection)</h3>
                    <button onClick={() => setActiveTab('transactions')} className="text-indigo-600 text-sm hover:underline">See All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left"><thead className="bg-slate-50 text-slate-600 text-sm uppercase"><tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Student</th>
                        <th className="p-4">Mode</th>
                        <th className="p-4 text-right">Amount</th>
                    </tr></thead><tbody className="divide-y divide-slate-100">{transactions.slice(0, 5).map(t => (
                        <tr key={t._id} className="hover:bg-slate-50">
                            {/* Hydration fix: toDateString() */}
                            <td className="p-4 text-sm text-slate-600">{new Date(t.createdAt).toDateString()}</td>
                            <td className="p-4 font-medium text-slate-800">{t.studentName}</td>
                            <td className="p-4 text-sm"><span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs">{t.paymentMode}</span></td>
                            <td className="p-4 text-right font-bold text-green-600">+₹{t.amount.toLocaleString('en-IN')}</td>
                        </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr><td colSpan="4" className="p-4 text-center text-slate-500"> transaction not found.</td></tr>
                    )}</tbody></table>
                </div>
            </div>
        </div>
    );

    const renderStudents = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Student List ({totalStudentsCount})</h2>
                <button 
                    onClick={() => setShowAddStudentModal(true)} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                >
                    <Plus size={18} /> Add Student
                </button>
            </div>

            <div className="relative mb-6">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    className="w-full border border-slate-300 rounded-xl py-3 pl-10 pr-4 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center p-10 bg-white rounded-xl shadow-sm">
                    <Loader2 size={24} className="animate-spin text-indigo-600 mr-3" /> Loading Students...
                </div>
            ) : error ? (
                <Alert message={`Error: ${error}`} type="error" onClose={() => setError(null)} />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left"><thead className="bg-slate-50 text-slate-600 text-sm uppercase"><tr>
                            <th className="p-4">Name / Roll</th>
                            <th className="p-4">Class</th>
                            <th className="p-4 text-right">Total Fees</th>
                            <th className="p-4 text-right">Paid</th>
                            <th className="p-4 text-right">Due</th>
                            <th className="p-4 text-center">Action</th>
                        </tr></thead><tbody className="divide-y divide-slate-100">{filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <tr key={student._id} className="hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-800">
                                    {student.name}
                                    <span className="block text-xs text-slate-500">Roll: {student.rollNo}</span>
                                </td>
                                <td className="p-4 text-sm text-slate-600">{student.class}</td>
                                <td className="p-4 text-right text-slate-700">₹{student.totalFees.toLocaleString('en-IN')}</td>
                                <td className="p-4 text-right text-green-600">₹{student.paidFees.toLocaleString('en-IN')}</td>
                                <td className={`p-4 text-right font-semibold ${student.totalFees - student.paidFees > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                    ₹{(student.totalFees - student.paidFees).toLocaleString('en-IN')}
                                </td>
                                <td className="p-4 text-center space-x-2">
                                    <button 
                                        onClick={() => { 
                                            setSelectedStudentForFee(student); 
                                            setShowPayFeeModal(true);
                                        }}
                                        disabled={student.totalFees - student.paidFees <= 0}
                                        className={`p-2 rounded-full text-white ${student.totalFees - student.paidFees > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-400 cursor-not-allowed'}`}
                                        title="Pay Fees"
                                    >
                                        <IndianRupee size={16} />
                                    </button>
                                    <button 
                                        onClick={() => deleteStudent(student._id, student.name)}
                                        className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
                                        title="Delete Student"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" className="p-6 text-center text-slate-500">No students found matching your search.</td></tr>
                        )}</tbody></table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderFees = () => {
        const studentsWithDue = students.filter(s => s.totalFees - s.paidFees > 0);

        return (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-red-600">Pending Fee Collection ({studentsWithDue.length})</h2>

                {isLoading ? (
                    <div className="flex justify-center items-center p-10 bg-white rounded-xl shadow-sm">
                        <Loader2 size={24} className="animate-spin text-red-600 mr-3" /> Fetching Pending Dues...
                    </div>
                ) : studentsWithDue.length === 0 ? (
                    <div className="p-8 bg-green-100 border border-green-400 text-green-700 rounded-xl text-center shadow-md">
                        <CheckCircle size={30} className="mx-auto mb-2" />
                        <p className="text-lg font-semibold">Great! No pending fees currently.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left"><thead className="bg-red-50 text-red-700 text-sm uppercase"><tr>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Class</th>
                                <th className="p-4 text-right">Pending Amount</th>
                                <th className="p-4 text-center">Collect</th>
                            </tr></thead><tbody className="divide-y divide-slate-100">{studentsWithDue.map(student => (
                                <tr key={student._id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-800">{student.name}</td>
                                    <td className="p-4 text-sm text-slate-600">{student.class}</td>
                                    <td className="p-4 text-right font-bold text-red-600">₹{(student.totalFees - student.paidFees).toLocaleString('en-IN')}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => { 
                                                setSelectedStudentForFee(student); 
                                                setShowPayFeeModal(true);
                                            }}
                                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
                                            title="Collect Fee"
                                        >
                                            <IndianRupee size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}</tbody></table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTransactions = () => (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800">All Transactions History ({transactions.length})</h2>

            {isLoading ? (
                <div className="flex justify-center items-center p-10 bg-white rounded-xl shadow-sm">
                    <Loader2 size={24} className="animate-spin text-indigo-600 mr-3" /> Loading Transactions...
                    </div>
            ) : transactions.length === 0 ? (
                <div className="p-8 bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-center shadow-md">
                    <ListRestart size={30} className="mx-auto mb-2" />
                    <p className="text-lg font-semibold">No transactions recorded yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left"><thead className="bg-slate-50 text-slate-600 text-sm uppercase"><tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Student</th>
                            <th className="p-4">Mode</th>
                            <th className="p-4 text-right">Amount</th>
                        </tr></thead><tbody className="divide-y divide-slate-100">{transactions.map(t => (
                            <tr key={t._id} className="hover:bg-slate-50">
                                {/* Hydration fix: toDateString() */}
                                <td className="p-4 text-sm text-slate-600">{new Date(t.createdAt).toDateString()}</td>
                                <td className="p-4 font-medium text-slate-800">{t.studentName}</td>
                                <td className="p-4 text-sm">
                                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs">{t.paymentMode}</span>
                                </td>
                                <td className="p-4 text-right font-bold text-green-600">+₹{t.amount.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}</tbody></table>
                    </div>
                </div>
            )}
        </div>
    );


    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <header className="bg-white shadow-sm z-10 p-4 flex items-center justify-between sticky top-0 md:pl-8">
                    <div className="md:hidden">
                        <button onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} className="text-slate-600" />
                        </button>
                    </div>
                    
                    {/* 👇️ DELETED: 'Welcome Admin' text and UserMenu in the header */}
                    <h1 className="text-xl font-bold text-slate-800 hidden md:block">
                        Fees Management Dashboard
                    </h1>
                    
                    {/* 👇️ DELETED: The right-side UserMenu div */}
                    <div className="md:hidden">
                        <h1 className="text-xl font-bold text-indigo-600">Fees Portal</h1>
                    </div>
                    <div className="hidden md:block">
                        {/* Empty or can be used for other icons */}
                    </div>
                    
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {message && (
                        <div className="mb-6">
                            <Alert 
                                message={message.text} 
                                type={message.type} 
                                onClose={() => setMessage(null)} 
                            />
                        </div>
                    )}

                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'students' && renderStudents()}
                    {activeTab === 'fees' && renderFees()}
                    {activeTab === 'transactions' && renderTransactions()}
                </main>
            </div>

            {/* Add Student Modal (Using StudentsForm Component) */}
            {showAddStudentModal && (
                <StudentsForm 
                    newStudent={newStudent}
                    setNewStudent={setNewStudent}
                    handleAddStudent={handleAddStudent}
                    onClose={() => setShowAddStudentModal(false)}
                />
            )}

            {/* Pay Fee Modal */}
            {showPayFeeModal && selectedStudentForFee && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-900 p-6 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold">Submit Fee </h3>
                                    <p className="text-indigo-200 text-sm">{selectedStudentForFee.name} ({selectedStudentForFee.class})</p>
                                </div>
                                <button onClick={() => setShowPayFeeModal(false)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="mt-4 flex gap-4 text-sm">
                                <div>
                                    <p className="text-slate-400">Total Fees</p>
                                    <p>₹{selectedStudentForFee.totalFees.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Paid Fees</p>
                                    <p className="text-green-400">₹{selectedStudentForFee.paidFees.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Due</p>
                                    <p className="text-red-400">₹{(selectedStudentForFee.totalFees - selectedStudentForFee.paidFees).toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handlePayFee} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">How Many Amount Pay </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                    <input 
                                        required 
                                        type="number" 
                                        min="1"
                                        max={selectedStudentForFee.totalFees - selectedStudentForFee.paidFees}
                                        className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 font-bold text-lg text-slate-800 focus:ring-green-500 focus:border-green-500" 
                                        value={feeAmount} 
                                        onChange={e => setFeeAmount(e.target.value)} 
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment (Mode)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Cash', 'UPI', 'Bank'].map(mode => (
                                        <button
                                            type="button"
                                            key={mode}
                                            onClick={() => setPaymentMode(mode)}
                                            className={`py-2 text-sm rounded-lg border transition-colors ${paymentMode === mode ? 'bg-indigo-600 border-indigo-600 text-white font-semibold shadow-md' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg mt-4 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200/50">
                                <CheckCircle size={18} /> Confirm Payment 
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}