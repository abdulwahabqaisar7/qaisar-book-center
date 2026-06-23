import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import Invoice from '@/models/Invoice';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    // Fetch invoices associated with this customer
    const invoices = await Invoice.find({ customerId: id }).sort({ createdAt: -1 });

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

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const customer = await Customer.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found.' }, { status: 404 });
    }

    // Only allow deletion if customer has no outstanding credit
    if (customer.creditBalance > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete customer with outstanding credit balance.'
      }, { status: 400 });
    }

    await Customer.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Customer deleted successfully.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
