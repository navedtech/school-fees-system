// src/components/StudentsForm.js
import React from 'react';
import { Plus, X } from 'lucide-react';

export default function StudentsForm({ newStudent, setNewStudent, handleAddStudent, onClose }) {

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                    <h3 className="text-lg font-bold text-slate-800">Add New Student</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                            <input 
                                required 
                                type="text" 
                                id="name" 
                                name="name"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                value={newStudent.name} 
                                onChange={handleChange} 
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="rollNo" className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
                            <input 
                                required 
                                type="text" 
                                id="rollNo" 
                                name="rollNo"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                value={newStudent.rollNo} 
                                onChange={handleChange} 
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        <div>
                            <label htmlFor="class" className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                            <select 
                                required 
                                id="class" 
                                name="class"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                value={newStudent.class} 
                                onChange={handleChange}
                            >
                                <option value="">Select Class</option>
                                {['8th', '9th', '10th', '11th', '12th'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="totalFees" className="block text-sm font-medium text-slate-700 mb-1">Annual Fees (₹)</label>
                            <input 
                                required 
                                type="number" 
                                id="totalFees" 
                                name="totalFees"
                                min="1000" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                value={newStudent.totalFees} 
                                onChange={handleChange} 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="parentName" className="block text-sm font-medium text-slate-700 mb-1">Parent's Name</label>
                        <input 
                            required 
                            type="text" 
                            id="parentName" 
                            name="parentName"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            value={newStudent.parentName} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="contact" className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                        <input 
                            required 
                            type="tel" 
                            id="contact" 
                            name="contact"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            value={newStudent.contact} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg mt-4 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Save Student Data
                    </button>
                </form>
            </div>
        </div>
    );
}