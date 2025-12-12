// src/components/UserMenu.js

import React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, UserCircle } from 'lucide-react';

export default function UserMenu() {
    const { data: session } = useSession();

    return (
        <div className="flex flex-col items-center p-2">
            
            {/* यह हिस्सा अब 'A' आइकॉन को हटाकर यूज़र की जानकारी दिखाता है */}
            <div className="flex items-center mb-2 gap-2 justify-center">
                 <UserCircle size={20} className="text-indigo-400" />
                 <p className="text-sm font-semibold text-slate-300">
                     {session?.user?.name || 'Admin'}
                 </p>
            </div>

            {/* Log Out Button */}
            <button 
                onClick={() => signOut({ callbackUrl: '/login' })} 
                className="w-full flex items-center justify-center gap-2 p-2 text-sm bg-indigo-700 hover:bg-indigo-600 rounded-lg transition-colors text-white"
            >
                <LogOut size={16} /> Log Out
            </button>
        </div>
    );
}