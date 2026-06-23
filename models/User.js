import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username.'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Please provide a password.'],
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],
    required: [true, 'Please specify a user role.'],
    default: 'customer',
  },
  displayName: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
