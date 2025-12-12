import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';
import FeeTransaction from '@/models/FeeTransaction';
import { NextResponse } from 'next/server';

/**
 * GET: Sabhi transactions fetch karega
 */
export async function GET() {
  try {
    await dbConnect();

    const transactions = await FeeTransaction.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error("GET Fees Transaction Error:", error);
    return NextResponse.json(
      { message: "Transaction data doesn't fetch.", error: error.message },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    await dbConnect();
    const { studentId, amount, paymentMode } = await request.json();

    // Validate basic fields
    if (!studentId || !amount || !paymentMode) {
      return NextResponse.json(
        { message: 'Fields missing: studentId, amount, paymentMode zaroori hain.' },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be valid number and greater than 0.' },
        { status: 400 }
      );
    }

    // Student fetch karo
    const student = await Student.findById(studentId);

    if (!student) {
      return NextResponse.json({ message: 'Student not found.' }, { status: 404 });
    }

    // Convert values (safe check)
    const total = Number(student.totalFees);
    const paid = Number(student.paidFees);

    const due = total - paid;

    if (numericAmount > due) {
      return NextResponse.json(
        {
          message: `Student remaining fees is ₹${due}. You ₹${numericAmount} can't accept.`,
        },
        { status: 400 }
      );
    }

    // #### Create Transaction ####
    const transaction = await FeeTransaction.create({
      studentId: student._id,
      studentName: student.name,
      amount: numericAmount,
      paymentMode,
      date: new Date(),
    });

    // #### Update Student Paid Fees ####
    student.paidFees = paid + numericAmount;
    await student.save();

    return NextResponse.json(
      { message: 'Fee payment record success.', transaction },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST Fee Payment Error:", error);
    return NextResponse.json(
      { message: 'Fee payment record unsuccess.', error: error.message },
      { status: 500 }
    );
  }
}
