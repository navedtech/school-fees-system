import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import Fee from "@/models/FeeRequest"; 
import { NextResponse } from "next/server";

// --- GET: Student ki requests dekhne ke liye ---
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Is student ki wo requests nikaalein jo "Pending" hain
    const requests = await Fee.find({ studentId, status: "Pending" }).sort({ createdAt: -1 });

    return NextResponse.json(requests, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- POST: Admin se request save karne ke liye (Already exists) ---
export async function POST(req) {
  try {
    await dbConnect(); 
    const { studentId, amount } = await req.json();

    if (!studentId || !amount) {
      return NextResponse.json({ error: "ID and Amount are required" }, { status: 400 });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const feeDoc = new Fee({
      studentId: student._id,
      studentName: student.name,
      amount: Number(amount),
      paymentMode: "Fee Request",
      status: "Pending",
    });

    await feeDoc.save();
    return NextResponse.json({ message: "Success" }, { status: 200 });

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Server error occurred" }, { status: 500 });
  }
}