// src/components/AuthProvider.js
"use client"; // <--- यह क्लाइंट डायरेक्टिव बहुत ज़रूरी है

import { SessionProvider } from 'next-auth/react';
import React from 'react';

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}