import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import Invoice from '@/models/Invoice';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const customer = await Customer.findOne({ userId: session.userId });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer ledger profile not found.' }, { status: 404 });
    }

    // Fetch invoices associated with this customer
    const invoices = await Invoice.find({ customerId: customer._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        customer,
        invoices
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
