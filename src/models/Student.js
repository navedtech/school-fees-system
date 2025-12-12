import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  rollNo: {
    type: String,
    required: [true, 'Please provide a Roll Number'],
    unique: true,
  },
  class: {
    type: String,
    required: true,
  },
  parentName: String,
  contact: String,
  totalFees: {
    type: Number,
    required: true,
  },
  paidFees: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);