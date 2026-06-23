import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { amount } = await request.json();

    if (amount === undefined || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Please provide a valid payment amount.' }, { status: 400 });
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    // Reduce the customer's credit balance
    customer.creditBalance = Math.max(0, customer.creditBalance - amount);
    await customer.save();

    return NextResponse.json({ success: true, data: customer }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
