import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import Customer from '@/models/Customer';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: invoice }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }

    // 1. Restore stock for each item
    for (const item of invoice.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // 2. Rollback credit balance and total purchases if customer exists
    if (invoice.customerId) {
      const updateQuery = {
        $inc: { totalPurchases: -invoice.totalAmount }
      };
      if (invoice.paymentMethod === 'On Credit') {
        updateQuery.$inc.creditBalance = -invoice.totalAmount;
      }
      await Customer.findByIdAndUpdate(invoice.customerId, updateQuery);
    }

    // 3. Delete invoice
    await Invoice.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Invoice deleted and stock restored.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

