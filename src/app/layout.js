// src/app/layout.js

import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "School Fees App",
  description: "A simple fees management application.",
};

export default function RootLayout({ children }) {
  return (
    // FIX: html tag must immediately follow the return statement without any extra newlines or indentations
    <html lang="en"> 
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}