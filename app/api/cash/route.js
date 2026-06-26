import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import CashTransaction from '@/models/CashTransaction';

export async function GET() {
  try {
    await connectDB();

    // Check if we need to seed historical cash transactions from existing invoices
    const count = await CashTransaction.countDocuments();
    if (count === 0) {
      const invoices = await Invoice.find({ paymentMethod: 'Cash' }).sort({ createdAt: 1 });
      if (invoices.length > 0) {
        const seedTxs = invoices.map(inv => ({
          amount: inv.totalAmount,
          type: 'sale',
          referenceId: inv._id,
          referenceModel: 'Invoice',
          description: `Sale Invoice ${inv.invoiceNumber}`,
          date: inv.createdAt
        }));
        await CashTransaction.insertMany(seedTxs);
      }
    }

    // Retrieve all transactions sorted by date descending
    const transactions = await CashTransaction.find({}).sort({ date: -1, createdAt: -1 });

    // Calculate metrics
    let availableCash = 0;
    let totalInflow = 0;
    let totalOutflow = 0;

    transactions.forEach(tx => {
      availableCash += tx.amount;
      if (tx.amount > 0) {
        totalInflow += tx.amount;
      } else {
        totalOutflow += Math.abs(tx.amount);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        availableCash,
        totalInflow,
        totalOutflow,
        transactions
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { amount, type, description } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Please enter a valid positive adjustment amount.' }, { status: 400 });
    }

    if (!type || !['adjustment_in', 'adjustment_out'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid adjustment type.' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Please provide a description/reason.' }, { status: 400 });
    }

    const transactionAmount = type === 'adjustment_in' ? amount : -amount;

    const tx = await CashTransaction.create({
      amount: transactionAmount,
      type,
      description: description.trim(),
      date: new Date()
    });

    return NextResponse.json({ success: true, data: tx }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
