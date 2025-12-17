import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FeeRequest from "@/models/FeeRequest";
import FeeTransaction from "@/models/FeeTransaction";
import Student from "@/models/Student";

export async function POST(req) {
  await connectDB();
  const { requestId, paymentMode } = await req.json();

  const request = await FeeRequest.findById(requestId).populate("studentId");

  request.status = "paid";
  request.paymentMode = paymentMode;
  request.paidAt = new Date();
  await request.save();

  await FeeTransaction.create({
    studentId: request.studentId._id,
    studentName: request.studentId.name,
    amount: request.amount,
    paymentMode,
  });

  await Student.findByIdAndUpdate(request.studentId._id, {
    $inc: { paidFees: request.amount },
  });

  return NextResponse.json({ success: true });
}
