import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import Product from '@/models/Product'; // needed for population

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let dateFilter = {};

    if (from && to) {
      dateFilter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999))
      };
    } else {
      const now = new Date();
      if (period === 'today') {
        const start = new Date(now.setHours(0, 0, 0, 0));
        dateFilter.createdAt = { $gte: start };
      } else if (period === 'week') {
        const start = new Date(now.setDate(now.getDate() - 7));
        dateFilter.createdAt = { $gte: start };
      } else if (period === 'month') {
        const start = new Date(now.setDate(now.getDate() - 30));
        dateFilter.createdAt = { $gte: start };
      } else if (period === 'year') {
        const start = new Date(now.setDate(now.getDate() - 365));
        dateFilter.createdAt = { $gte: start };
      }
      // 'all' leaves dateFilter empty
    }

    const invoices = await Invoice.find(dateFilter).populate('items.productId');

    let totalRevenue = 0;
    let totalCost = 0;
    const totalInvoices = invoices.length;

    const salesByDayMap = {};
    const productSalesMap = {};
    const categorySalesMap = {};
    const paymentMethodMap = {};

    for (const inv of invoices) {
      totalRevenue += inv.totalAmount;
      
      // Payment method
      paymentMethodMap[inv.paymentMethod] = (paymentMethodMap[inv.paymentMethod] || 0) + inv.totalAmount;

      // Date group (YYYY-MM-DD)
      const dateStr = new Date(inv.createdAt).toISOString().split('T')[0];
      if (!salesByDayMap[dateStr]) {
        salesByDayMap[dateStr] = { date: dateStr, totalSales: 0, invoiceCount: 0 };
      }
      salesByDayMap[dateStr].totalSales += inv.totalAmount;
      salesByDayMap[dateStr].invoiceCount += 1;

      // Items
      for (const item of inv.items) {
        // Calculate cost
        const productCost = (item.productId && item.productId.costPrice) ? item.productId.costPrice : item.price * 0.7; // fallback to 70% of price
        totalCost += productCost * item.quantity;

        // Top products
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSalesMap[item.name].quantity += item.quantity;
        productSalesMap[item.name].revenue += item.subtotal;

        // Category breakdown
        const productCategory = (item.productId && item.productId.category) ? item.productId.category : 'Other';
        categorySalesMap[productCategory] = (categorySalesMap[productCategory] || 0) + item.subtotal;
      }
    }

    // Convert Maps to Arrays and sort
    const salesByDay = Object.values(salesByDayMap).sort((a, b) => a.date.localeCompare(b.date));
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    const categoryBreakdown = Object.entries(categorySalesMap).map(([name, value]) => ({ name, value }));
    const paymentMethodBreakdown = Object.entries(paymentMethodMap).map(([name, value]) => ({ name, value }));

    const grossProfit = totalRevenue - totalCost;
    const avgInvoiceValue = totalInvoices > 0 ? Math.round(totalRevenue / totalInvoices) : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCost,
          grossProfit,
          avgInvoiceValue,
          totalInvoices
        },
        salesByDay,
        topProducts,
        categoryBreakdown,
        paymentMethodBreakdown
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
