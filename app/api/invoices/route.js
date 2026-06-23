import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product';
import Customer from '@/models/Customer';

export async function GET() {
  try {
    await connectDB();
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: invoices }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { customerName, customerPhone, items, subtotal, discount, tax, totalAmount, paymentMethod, customerId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cannot create an empty invoice.' }, { status: 400 });
    }

    // 1. Verify and decrement stock atomically
    const updatedItems = [];
    try {
      for (const item of items) {
        const product = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (!product) {
          const currentProduct = await Product.findById(item.productId);
          const available = currentProduct ? currentProduct.stock : 0;
          throw new Error(`Insufficient stock for "${item.name}". Requested: ${item.quantity}, Available: ${available}`);
        }
        updatedItems.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (error) {
      for (const rolled of updatedItems) {
        await Product.findByIdAndUpdate(rolled.productId, { $inc: { stock: rolled.quantity } });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // 2. Generate sequential invoice number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const countToday = await Invoice.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const sequence = String(countToday + 1).padStart(4, '0');
    const invoiceNumber = `QBC-${dateStr}-${sequence}`;

    // 3. Create the invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      tax,
      totalAmount,
      paymentMethod,
      customerId: customerId || null
    });

    // 4. Update customer ledger stats if customerId is linked
    if (customerId) {
      const updateQuery = {
        $inc: { totalPurchases: totalAmount }
      };
      if (paymentMethod === 'On Credit') {
        updateQuery.$inc.creditBalance = totalAmount;
      }
      await Customer.findByIdAndUpdate(customerId, updateQuery);
    }

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

