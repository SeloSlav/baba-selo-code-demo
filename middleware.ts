import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { geolocation } from '@vercel/functions' // Import the Vercel helper

// Minimal middleware function to allow all requests through for testing
// export function middleware(request: NextRequest) {
//   return NextResponse.next()
// }

// Optional: You can keep a minimal config or comment it out entirely
// export const config = {
//   matcher: '/:path*', // Or keep the more specific matcher if preferred
// };

// --- Original Middleware Code (Restored with Logging) ---

// NOTE: The declare module block for NextRequest is no longer strictly needed
// as we are using the geolocation helper, but it doesn't hurt to keep it.
declare module 'next/server' {
  interface NextRequest {
    geo?: {
      country?: string;
      city?: string;
      region?: string;
    }
  }
}

// Allowed country codes (ISO 3166-1 alpha-2)
const ALLOWED_COUNTRIES = ['US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'SE', 'PL', 'RO', 'BE', 'CZ', 'GR', 'PT', 'HU', 'IE', 'DK', 'FI', 'SK', 'BG', 'HR', 'LT', 'SI', 'LV', 'EE', 'LU', 'MT', 'CY', 'AE']

export function middleware(request: NextRequest) {
  // Skip static files and internal Next.js paths
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|webmanifest|json|woff2|woff|ttf)$/i)) {
    return NextResponse.next();
  }

  // Skip in development environment
  if (process.env.NODE_ENV === 'development') {
      // console.log("[Middleware] Skipping geo-check in development.");
      return NextResponse.next();
  }
  
  // Use the Vercel geolocation helper
  const { country } = geolocation(request); // country can be string | undefined
  console.log(`[Middleware] Request for ${pathname}, Country from helper: ${country}`);

  // Default Deny: Allow ONLY if country is determined AND is in the allowed list.
  if (country && ALLOWED_COUNTRIES.includes(country)) {
    console.log(`[Middleware] Access Allowed for country: ${country}.`);
    return NextResponse.next();
  }
  
  // Otherwise, block the request
  console.log(`[Middleware] Access Denied for country: ${country || 'Unknown'}. Rewriting to /access-denied`);
  return NextResponse.rewrite(new URL('/access-denied', request.url));
}

// Config can be simplified now as filtering is done inside the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Match all paths that contain a dot (likely static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}; 