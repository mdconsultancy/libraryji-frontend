/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production'

// Origin of the Laravel API (also serves signed /media images).
const apiOrigin = (() => {
    try {
        return new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').origin
    } catch {
        return ''
    }
})()

// Content-Security-Policy: only the third parties the app actually uses —
// Google Identity Services (sign-in), Razorpay Checkout, Cashfree Checkout, Iconify icon API, Meta Pixel.
// 'unsafe-inline' scripts are still needed by Next.js' inline bootstrap
// without a nonce setup; 'unsafe-eval' only in development (React refresh).
const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://accounts.google.com https://checkout.razorpay.com https://sdk.cashfree.com https://connect.facebook.net`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    `img-src 'self' data: blob: ${apiOrigin} https://*.googleusercontent.com https://www.facebook.com https://*.razorpay.com https://*.cashfree.com`,
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin} https://accounts.google.com https://*.razorpay.com https://*.cashfree.com https://api.iconify.design https://api.unisvg.com https://api.simplesvg.com https://www.facebook.com https://connect.facebook.net ${isDev ? 'ws: http://localhost:*' : ''}`,
    'frame-src https://accounts.google.com https://api.razorpay.com https://checkout.razorpay.com https://*.cashfree.com',
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://api.razorpay.com https://*.cashfree.com",
    "frame-ancestors 'none'",
    isDev ? '' : 'upgrade-insecure-requests',
]
    .filter(Boolean)
    .join('; ')
    .replace(/\s+/g, ' ')

const securityHeaders = [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Camera is used by the member photo capture modal (same origin only).
    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://sdk.cashfree.com" "https://payments.cashfree.com")' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
]

const nextConfig = {
    reactStrictMode: false,
    images: { unoptimized: true },
    // Don't ship browser source maps or advertise the framework.
    productionBrowserSourceMaps: false,
    poweredByHeader: false,
    // three.js / @react-three/fiber define some classes that extend
    // browser-only globals at module-evaluation time — bundling them into
    // the server build (even for a component only ever rendered client-side
    // via `dynamic(..., { ssr: false })`) crashes Next's page-data
    // collection step with "Class extends value undefined is not a
    // constructor". Marking them external skips that server-side bundling.
    serverExternalPackages: ["three", "@react-three/fiber"],
    async headers() {
        return [{ source: '/:path*', headers: securityHeaders }]
    },
};

export default nextConfig;
