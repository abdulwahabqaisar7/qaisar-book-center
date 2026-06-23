import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    // Select only customer-safe fields (exclude costPrice)
    const products = await Product.find({ stock: { $gt: 0 } })
      .select('name sku price stock category description')
      .sort({ name: 1 });
    return NextResponse.json({ success: true, data: products }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
