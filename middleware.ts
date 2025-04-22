import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal middleware function to allow all requests through for testing
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Optional: You can keep a minimal config or comment it out entirely
// export const config = {
//   matcher: '/:path*', // Or keep the more specific matcher if preferred
// };

/*
// --- Original Middleware Code (Commented Out) ---

// Extend NextRequest to include Vercel-specific geo information
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

// Original middleware function
// export function middleware(request: NextRequest) {
//   // Skip geo-restriction for static files and in development environment
//   const url = new URL(request.url)
//   const isDev = process.env.NODE_ENV === 'development'
//   const isStaticFile = /\.(js|css|png|jpg|jpeg|svg|ico|webmanifest|json|woff2|woff|ttf)$/i.test(url.pathname)
  
//   // Skip geo-check for static files or in development mode
//   if (isStaticFile || isDev) {
//     return NextResponse.next()
//   }

//   // Access geo information which is provided by Vercel at the edge
//   const country = request.geo?.country || 'XX'

//   if (!ALLOWED_COUNTRIES.includes(country)) {
//     // Redirect to custom access-denied page instead of returning 403 message
//     return NextResponse.rewrite(new URL('/access-denied', request.url))
//   }

//   return NextResponse.next()
// }

// Original config
// export const config = {
//   matcher: [
//     // Match all paths
//     '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|apple-touch-icon.png).*)',
//   ],
// }
*/ 