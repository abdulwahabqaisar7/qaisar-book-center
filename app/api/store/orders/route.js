import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
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

    const orders = await Order.find({ customerId: customer._id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: orders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
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

    const { items, preferredPayment, notes } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cannot place an empty order.' }, { status: 400 });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.name}` }, { status: 400 });
      }
      if (item.quantity > product.stock) {
        return NextResponse.json({
          success: false,
          error: `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock}`
        }, { status: 400 });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const countToday = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const sequence = String(countToday + 1).padStart(4, '0');
    const orderNumber = `ORD-${dateStr}-${sequence}`;

    const order = await Order.create({
      orderNumber,
      customerId: customer._id,
      userId: session.userId,
      items: orderItems,
      subtotal,
      notes,
      preferredPayment: preferredPayment || 'Cash',
      status: 'pending'
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
