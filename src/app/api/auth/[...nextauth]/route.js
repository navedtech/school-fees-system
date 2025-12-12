// src/app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from '@/lib/mongodb'; // अपने DB connection path को यहाँ एडजस्ट करें
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const authOptions = {
  // 1. ऑथेंटिकेशन प्रोवाइडर (ईमेल/पासवर्ड लॉगिन के लिए CredentialsProvider)
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        await dbConnect(); // DB से कनेक्ट करें

        // 1.1. यूजर को ईमेल से खोजें
        const user = await User.findOne({ email: credentials.email }).lean();

        if (user) {
          // 1.2. पासवर्ड मैच करें
          const isMatch = await bcrypt.compare(credentials.password, user.password);

          if (isMatch) {
            // 1.3. अगर पासवर्ड सही है, तो यूजर ऑब्जेक्ट रिटर्न करें
            return {
              id: user._id.toString(), // NextAuth को string ID चाहिए
              name: user.name,
              email: user.email,
              role: user.role // रोल भी सेशन में भेजें
            };
          }
        }
        // अगर ऑथेंटिकेशन फेल हुआ
        return null;
      }
    })
  ],
  
  // 2. सेशन कॉन्फ़िगरेशन
  session: {
    strategy: 'jwt',
  },
  
  // 3. पेज कॉन्फ़िगरेशन
  pages: {
    signIn: '/login', // वह पेज जहाँ यूजर को रीडायरेक्ट किया जाएगा
    error: '/login', // एरर होने पर
  },
  
  // 4. JWT और सेशन में रोल या अन्य डेटा जोड़ने के लिए कॉलबैक
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };