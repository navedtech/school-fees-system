// src/app/api/register/route.js

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    await dbConnect();

    const { name, email, password } = await request.json();

    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return Response.json({ message: "User already exists with this email." }, { status: 400 });
    }

  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin', n
    });

    return Response.json({ message: "User registered successfully!", userId: newUser._id }, { status: 201 });

  } catch (error) {
    console.error(error);
    return Response.json({ message: "Registration failed." }, { status: 500 });
  }
}