import mongoose from 'mongoose';

const PurchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      costPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      }
    }
  ],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Mobile Transfer', 'On Credit'],
    default: 'Cash',
  },
  notes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed',
  }
}, {
  timestamps: true,
});

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
