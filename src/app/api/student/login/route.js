import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("Connecting to DB...");
    await dbConnect();
    console.log("DB Connected Successfully");
    
    const body = await req.json();
    const { name, rollNo, class: sClass } = body;

    console.log("Login Request Received for:", { name, rollNo, sClass });

    // 1. Pehle check karein ki data aaya bhi hai ya nahi
    if (!name || !rollNo || !sClass) {
      return NextResponse.json(
        { message: "Please enter Name, Roll No and Class" },
        { status: 400 }
      );
    }

    // 2. Database mein student ko dhoondna
    // Humne name ko Case-Insensitive rakha hai ($options: 'i')
    const student = await Student.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      rollNo: rollNo.trim(),
      class: sClass
    });

    // 3. Agar student nahi mila
    if (!student) {
      console.log("User not found in Database");
      return NextResponse.json(
        { message: "Wrong Information: Record not found" },
        { status: 401 }
      );
    }

    // 4. Success: Student ka data bhejna
    console.log("Success: Student Logged In ->", student.name);
    return NextResponse.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        class: student.class,
        totalFees: student.totalFees,
        paidFees: student.paidFees
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: "Server error occurred" },
      { status: 500 }
    );
  }
}