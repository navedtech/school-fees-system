import dbConnect from "@/lib/mongodb";
import Student from "@/models/Student";
import { NextResponse } from "next/server";

/* ================= GET ALL STUDENTS ================= */
export async function GET() {
  try {
    await dbConnect();
    const students = await Student.find({}).sort({ rollNo: 1 });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Students data doesn't fetch", error: error.message },
      { status: 500 }
    );
  }
}

/* ================= ADD NEW STUDENT ================= */
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { name, rollNo, class: cls, session, totalFees } = body;

    if (!name || !rollNo || !cls || !session || !totalFees) {
      return NextResponse.json(
        { message: "All fields including session are required" },
        { status: 400 }
      );
    }

    const student = await Student.create({
      name: name.trim(),
      rollNo: rollNo.trim(),
      class: cls,
      session: session.trim(),
      totalFees: Number(totalFees),
      paidFees: 0,
      parentName: body.parentName || "",
      contact: body.contact || "",
    });

    return NextResponse.json(
      { message: "Student added successfully", student },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        {
          message:
            "Student with same Roll No already exists in this Class & Session",
        },
        { status: 409 }
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (val) => val.message
      );
      return NextResponse.json(
        { message: messages.join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to add student", error: error.message },
      { status: 500 }
    );
  }
}

/* ================= UPDATE STUDENT ================= */
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { _id, name, rollNo, class: cls, session, totalFees } = body;

    if (!_id) {
      return NextResponse.json(
        { message: "Student ID missing" },
        { status: 400 }
      );
    }

    if (!name || !rollNo || !cls || !session || !totalFees) {
      return NextResponse.json(
        { message: "All fields including session are required" },
        { status: 400 }
      );
    }

    const duplicate = await Student.findOne({
      rollNo: rollNo.trim(),
      class: cls,
      session: session.trim(),
      _id: { $ne: _id },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          message:
            "Another student already exists with same Roll No, Class & Session",
        },
        { status: 409 }
      );
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      _id,
      {
        $set: {
          name: name.trim(),
          rollNo: rollNo.trim(),
          class: cls,
          session: session.trim(),
          totalFees: Number(totalFees),
          parentName: body.parentName || "",
          contact: body.contact || "",
        },
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      { message: "Student updated successfully", student: updatedStudent },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to update student", error: error.message },
      { status: 500 }
    );
  }
}

/* ================= DELETE STUDENT ================= */
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Student ID missing" },
        { status: 400 }
      );
    }

    const deleted = await Student.deleteOne({ _id: id });

    if (deleted.deletedCount === 0) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Student deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Delete failed", error: error.message },
      { status: 500 }
    );
  }
}
