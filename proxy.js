import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.SESSION_SECRET || 'qbc_default_secret_key_for_sessions_2026';
const secret = new TextEncoder().encode(SECRET_KEY);

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public assets & static paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Allow public auth paths
  const isPublicAuthRoute = 
    pathname === '/login' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/setup';

  if (isPublicAuthRoute) {
    return NextResponse.next();
  }

  // 3. Read cookie
  const token = request.cookies.get('qbc_session')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Verify token
  let payload;
  try {
    const { payload: jwtPayload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    payload = jwtPayload;
  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('qbc_session');
    return response;
  }

  const { role } = payload;

  // 5. Role-based routing
  if (role === 'admin') {
    // Admin trying to access store routes
    if (pathname.startsWith('/store') || pathname.startsWith('/api/store')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } else if (role === 'customer') {
    // Customer trying to access admin dashboard routes or admin api routes
    const isAdminRoute =
      pathname === '/' ||
      pathname === '/inventory' ||
      pathname.startsWith('/invoice') ||
      pathname.startsWith('/customers') ||
      pathname.startsWith('/reports') ||
      pathname.startsWith('/orders') ||
      (pathname.startsWith('/api/') && !pathname.startsWith('/api/store') && !pathname.startsWith('/api/auth'));

    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/store', request.url));
    }
  }

  // If role is customer and accessing root '/', redirect to store
  if (pathname === '/' && role === 'customer') {
    return NextResponse.redirect(new URL('/store', request.url));
  }

  return NextResponse.next();
}

// Config to specify matching routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
