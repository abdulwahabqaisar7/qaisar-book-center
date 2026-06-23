import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the product.'],
    trim: true,
  },
  sku: {
    type: String,
    required: [true, 'Please provide a SKU/code for the product.'],
    unique: true,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price.'],
    min: [0, 'Price cannot be negative.'],
  },
  costPrice: {
    type: Number,
    required: [true, 'Please provide a cost price.'],
    min: [0, 'Cost price cannot be negative.'],
  },
  stock: {
    type: Number,
    required: [true, 'Please provide the stock quantity.'],
    min: [0, 'Stock cannot be negative.'],
    default: 0,
  },
  minStock: {
    type: Number,
    required: [true, 'Please provide a minimum stock threshold for alerts.'],
    min: [0, 'Minimum stock cannot be negative.'],
    default: 5,
  },
  category: {
    type: String,
    required: [true, 'Please provide a category.'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
