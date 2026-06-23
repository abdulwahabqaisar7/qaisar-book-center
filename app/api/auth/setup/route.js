import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Customer from '@/models/Customer';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return NextResponse.json({ success: false, error: 'Database is already set up.' }, { status: 400 });
    }

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin101', 10);
    const customerPasswordHash = await bcrypt.hash(process.env.CUSTOMER_PASSWORD || 'customer123', 10);

    // 1. Create Admin User
    const adminUser = await User.create({
      username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
      passwordHash: adminPasswordHash,
      role: 'admin',
      displayName: 'QBC Admin'
    });

    // 2. Create Customer User
    const customerUser = await User.create({
      username: (process.env.CUSTOMER_USERNAME || 'customer').toLowerCase(),
      passwordHash: customerPasswordHash,
      role: 'customer',
      displayName: 'Default Customer',
      address: 'Main Bazaar Nishat Colony Lahore'
    });

    // 3. Create linked Customer model entry
    const customerProfile = await Customer.create({
      name: 'Default Customer',
      phone: '0300-1234567',
      address: 'Main Bazaar Nishat Colony Lahore',
      creditBalance: 0,
      totalPurchases: 0,
      userId: customerUser._id,
      notes: 'Seed customer account linked to customer user'
    });

    return NextResponse.json({
      success: true,
      message: 'Setup completed successfully.',
      admin: { username: adminUser.username },
      customer: { username: customerUser.username, profileId: customerProfile._id }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
