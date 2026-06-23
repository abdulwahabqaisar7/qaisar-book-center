import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import Invoice from '@/models/Invoice';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const order = await Order.findById(id).populate('customerId');
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { status, discount = 0, tax = 0, paymentMethod } = await request.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Only pending orders can be updated.' }, { status: 400 });
    }

    if (status === 'cancelled') {
      order.status = 'cancelled';
      await order.save();
      return NextResponse.json({ success: true, data: order, message: 'Order cancelled successfully.' }, { status: 200 });
    }

    if (status === 'confirmed') {
      const updatedItems = [];
      try {
        for (const item of order.items) {
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

      const customer = await Customer.findById(order.customerId);
      if (!customer) {
        for (const rolled of updatedItems) {
          await Product.findByIdAndUpdate(rolled.productId, { $inc: { stock: rolled.quantity } });
        }
        return NextResponse.json({ success: false, error: 'Associated customer ledger profile not found.' }, { status: 400 });
      }

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

      const discountVal = Number(discount) || 0;
      const taxPercent = Number(tax) || 0;
      const taxVal = Math.round((order.subtotal - discountVal) * (taxPercent / 100));
      const totalAmount = Math.max(0, order.subtotal - discountVal + taxVal);
      const finalPaymentMethod = paymentMethod || order.preferredPayment || 'Cash';

      const invoice = await Invoice.create({
        invoiceNumber,
        customerName: customer.name,
        customerPhone: customer.phone,
        items: order.items.map(i => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.subtotal
        })),
        subtotal: order.subtotal,
        discount: discountVal,
        tax: taxPercent,
        totalAmount,
        paymentMethod: finalPaymentMethod,
        customerId: customer._id,
        status: 'completed'
      });

      const customerUpdate = {
        $inc: { totalPurchases: totalAmount }
      };
      if (finalPaymentMethod === 'On Credit') {
        customerUpdate.$inc.creditBalance = totalAmount;
      }
      await Customer.findByIdAndUpdate(customer._id, customerUpdate);

      order.status = 'confirmed';
      order.invoiceId = invoice._id;
      await order.save();

      return NextResponse.json({
        success: true,
        data: { order, invoice }
      }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: 'Invalid status update action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
