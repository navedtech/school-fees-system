import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const students = await Student.find({}).sort({ rollNo: 1 });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Students data doesn't fetch ", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    body.totalFees = Number(body.totalFees);
    body.paidFees = 0;

    const student = await Student.create(body);

    return NextResponse.json(
      { message: "Student add Succes.", student },
      { status: 201 }
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return NextResponse.json({ message: messages.join(", ") }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Roll number already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Unable to Add Student", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Student ID missing." }, { status: 400 });
    }

    const deletedStudent = await Student.deleteOne({ _id: id });

    if (deletedStudent.deletedCount === 0) {
      return NextResponse.json({ message: "Student not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Student deleted" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Delete fail.", error: error.message },
      { status: 500 }
    );
  }
}
