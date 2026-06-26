import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Purchase from '@/models/Purchase';
import Product from '@/models/Product';
import CashTransaction from '@/models/CashTransaction';

export async function GET() {
  try {
    await connectDB();
    const purchases = await Purchase.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: purchases }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { items, subtotal, discount, tax, totalAmount, paymentMethod, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cannot create an empty purchase invoice.' }, { status: 400 });
    }

    // 1. Update product stocks and cost prices
    const updatedProducts = [];
    try {
      for (const item of items) {
        // Increment stock and update costPrice
        const product = await Product.findByIdAndUpdate(
          item.productId,
          { 
            $inc: { stock: item.quantity },
            $set: { costPrice: item.costPrice }
          },
          { new: true }
        );

        if (!product) {
          throw new Error(`Product not found for ID: ${item.productId}`);
        }
        updatedProducts.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (error) {
      // Rollback stock updates on failure (revert increments)
      for (const rolled of updatedProducts) {
        await Product.findByIdAndUpdate(rolled.productId, { $inc: { stock: -rolled.quantity } });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // 2. Generate sequential purchase invoice number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const countToday = await Purchase.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const sequence = String(countToday + 1).padStart(4, '0');
    const purchaseNumber = `QBC-PUR-${dateStr}-${sequence}`;

    // 3. Create the purchase invoice record
    const purchase = await Purchase.create({
      purchaseNumber,
      items,
      subtotal,
      discount,
      tax,
      totalAmount,
      paymentMethod,
      notes
    });

    // 4. Record Cash Transaction outflow if payment method is Cash
    if (paymentMethod === 'Cash') {
      await CashTransaction.create({
        amount: -totalAmount,
        type: 'purchase',
        referenceId: purchase._id,
        referenceModel: 'Purchase',
        description: `Purchase Invoice ${purchaseNumber}`,
        date: purchase.createdAt || new Date()
      });
    }

    return NextResponse.json({ success: true, data: purchase }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
