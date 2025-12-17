import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from '@/lib/mongodb'; 
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await dbConnect(); 

        // 1. User ko email se dhoondein
        const user = await User.findOne({ email: credentials.email }).lean();

        // 2. AGAR USER NAHI MILA (Corrected Logic: !user)
        if (!user) {
          throw new Error("No user found with this email");
        }

        // 3. Password check karein
        const isMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isMatch) {
          throw new Error("Invalid password");
        }

        // 4. Sab sahi hai toh user object return karein
        return {
          id: user._id.toString(), 
          name: user.name,
          email: user.email,
          role: user.role 
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login', 
    error: '/login', 
  },
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