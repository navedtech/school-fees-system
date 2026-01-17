import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FeeRequest from "@/models/FeeRequest";
import FeeTransaction from "@/models/FeeTransaction";
import Student from "@/models/Student";

export async function POST(req) {
  try {
    await connectDB();
    const { requestId, paymentMode } = await req.json();

    if (!requestId || !paymentMode) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1️⃣ Find request + student
    const request = await FeeRequest.findById(requestId).populate("studentId");

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 2️⃣ Mark request as PAID
    request.status = "Paid"; // ✅ CAPITAL P
    request.paymentMode = paymentMode;
    request.paidAt = new Date();
    await request.save();

    // 3️⃣ Create transaction record
    await FeeTransaction.create({
      studentId: request.studentId._id,
      studentName: request.studentId.name,
      amount: request.amount,
      paymentMode,
    });

    // 4️⃣ 🔥 MOST IMPORTANT FIX
    await Student.findByIdAndUpdate(
      request.studentId._id,
      {
        $inc: { paidFees: request.amount }, // ✅ update paidFees
        isRequestSent: false,                // ✅ allow next request
      },
      { new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PAY_API_ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
