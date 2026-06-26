import mongoose from 'mongoose';

const CashTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['sale', 'purchase', 'customer_payment', 'adjustment_in', 'adjustment_out'],
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  referenceModel: {
    type: String,
    required: false,
    enum: ['Invoice', 'Purchase', 'Customer'],
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

export default mongoose.models.CashTransaction || mongoose.model('CashTransaction', CashTransactionSchema);
