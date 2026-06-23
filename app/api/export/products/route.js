import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ name: 1 });

    // CSV header
    let csv = 'Product Name,SKU,Category,Price (Rs.),Cost Price (Rs.),Stock Level,Min Stock Alert\n';

    // CSV rows
    for (const p of products) {
      const name = `"${p.name.replace(/"/g, '""')}"`;
      const sku = `"${p.sku.replace(/"/g, '""')}"`;
      const category = `"${p.category.replace(/"/g, '""')}"`;
      
      csv += `${name},${sku},${category},${p.price},${p.costPrice},${p.stock},${p.minStock}\n`;
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=qbc-products-inventory.csv'
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
