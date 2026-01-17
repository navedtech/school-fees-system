import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    rollNo: {
      type: String,
      required: true,
      trim: true,
    },

    class: {
      type: String,
      required: true,
    },

    session: {
      type: String,
      required: true,
      trim: true,
    },

    parentName: {
      type: String,
      default: "",
    },

    contact: {
      type: String,
      default: "",
    },

    totalFees: {
      type: Number,
      required: true,
    },

    paidFees: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* ✅ COMPOUND UNIQUE (REAL FIX) */
StudentSchema.index(
  { rollNo: 1, class: 1, session: 1 },
  { unique: true }
);

export default mongoose.models.Student ||
  mongoose.model("Student", StudentSchema);
