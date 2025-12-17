import mongoose from "mongoose";

const FeeRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  studentName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMode: { type: String, default: "Fee Request" },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.FeeRequest || mongoose.model("FeeRequest", FeeRequestSchema);