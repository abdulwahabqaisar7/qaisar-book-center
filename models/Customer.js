import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the customer name.'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  creditBalance: {
    type: Number,
    default: 0,
    min: [0, 'Credit balance cannot be negative.'],
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
});

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
