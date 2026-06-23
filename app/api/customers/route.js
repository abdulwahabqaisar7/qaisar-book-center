import connectDB from '@/lib/db';
import Customer from '@/models/Customer';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const customers = await Customer.find(query).sort({ name: 1 });
    return Response.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return Response.json({ success: false, error: 'Failed to fetch customers.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const customer = await Customer.create(body);
    return Response.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === 11000) {
      return Response.json({ success: false, error: 'A customer with this name already exists.' }, { status: 400 });
    }
    return Response.json({ success: false, error: error.message || 'Failed to create customer.' }, { status: 400 });
  }
}
