import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = {};
    if (from && to) {
      query.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999))
      };
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });

    // CSV header
    let csv = 'Invoice Number,Date,Customer Name,Customer Contact,Subtotal (Rs.),Discount (Rs.),Tax (GST %),Total Amount (Rs.),Payment Method\n';

    // CSV rows
    for (const inv of invoices) {
      const invNum = `"${inv.invoiceNumber.replace(/"/g, '""')}"`;
      const dateStr = new Date(inv.createdAt).toLocaleDateString();
      const custName = `"${inv.customerName.replace(/"/g, '""')}"`;
      const custPhone = `"${(inv.customerPhone || '').replace(/"/g, '""')}"`;
      const payMethod = `"${inv.paymentMethod.replace(/"/g, '""')}"`;
      const taxPercent = inv.tax || 0;

      csv += `${invNum},${dateStr},${custName},${custPhone},${inv.subtotal},${inv.discount},${taxPercent}%,${inv.totalAmount},${payMethod}\n`;
    }

    const filename = from && to ? `qbc-invoices-${from}-to-${to}.csv` : 'qbc-invoices-all.csv';

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${filename}`
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
