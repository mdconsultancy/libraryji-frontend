import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './css/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { BrandingProvider } from '@/context/BrandingContext'
import MetaPixel from '@/components/shared/MetaPixel'
import SWRProvider from '@/components/providers/SWRProvider'

const manrope = Manrope({ subsets: ["latin"] });

const SITE_URL = 'https://libraryji.in'
const SITE_NAME = 'LibraryJi'
const SITE_DESCRIPTION =
  'LibraryJi is a library management system and study room / reading room management software (SaaS) for libraries across India — manage seats, student enrollment, attendance, fee collection, and reports online. Free trial available for libraries in every city, including Bhavnagar (Gujarat), Jodhpur (Rajasthan), and beyond.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // %s lets any page override just its own prefix (e.g. "Pricing | LibraryJi")
  // while keeping the brand suffix consistent everywhere.
  title: {
    default: 'LibraryJi — Library Management System & Study Room Software (SaaS)',
    template: '%s | LibraryJi',
  },
  description: SITE_DESCRIPTION,
  // Meta keywords carry ~no ranking weight with Google today, but cost
  // nothing and are still read by some secondary search engines/directories.
  // The real ranking work these keywords need is genuine on-page content —
  // see the public marketing homepage discussion.
  keywords: [
    'library management system',
    'library management software',
    'library SaaS software',
    'study room management software',
    'reading room management software',
    'library seat booking software',
    'library attendance software',
    'library fee management software',
    'library management system India',
    'library management in Bhavnagar Gujarat',
    'library management in Jodhpur Rajasthan',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'LibraryJi — Library Management System & Study Room Software (SaaS)',
    description: SITE_DESCRIPTION,
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LibraryJi — Library Management System & Study Room Software (SaaS)',
    description: SITE_DESCRIPTION,
    images: ['/images/og-image.png'],
  },
  // Deliberately no `icons` here: Next.js would inject its own <link rel="icon">
  // alongside the one below, and BrandingContext (which swaps it to the
  // uploaded favicon at runtime) can only reliably control a link tag it
  // knows the id of — two competing ones is how a favicon update silently
  // "doesn't work" (the browser may keep using whichever one it saw first).
}

// No viewport meta previously existed at all, so mobile browsers fell back to
// a ~980px desktop-width layout viewport: the page rendered zoomed out with a
// horizontal scrollbar, and the >=16px input font-size rule in globals.css
// meant to stop iOS's auto-zoom-on-focus never actually applied (its
// max-width:767px media query never matched without a real device-width
// viewport). Adding width=device-width fixes both — pinch-zoom is left
// enabled deliberately (no maximumScale), matching that rule's intent.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning className='scroll-smooth'>
      <head>
        {/* Primary favicon link, id'd so BrandingContext can reliably find and
            swap it to a tenant-uploaded favicon at runtime. The extra sized
            links below are supplementary (favicon.ico for the handful of
            crawlers/browsers that still probe that exact path by convention,
            plus explicit 16/32px sizes) — none of them share this id, so
            BrandingContext's runtime swap never conflicts with them. */}
        <link id='app-favicon' rel='icon' href='/favicon.png' type='image/png' />
        <link rel='icon' href='/favicon.ico' sizes='48x48' />
        <link rel='icon' href='/favicon-16x16.png' sizes='16x16' type='image/png' />
        <link rel='icon' href='/favicon-32x32.png' sizes='32x32' type='image/png' />
        <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
        <link rel='manifest' href='/site.webmanifest' />
        <meta name='theme-color' content='#173F8A' />
        {/* Warms up the connection to Google's OAuth domains ahead of time —
            "Continue with Google" (Login/Register) loads its script and iframe
            from these origins the moment BrandingContext's /theme fetch
            resolves; without this hint that connection only starts then,
            adding a full DNS+TLS handshake's worth of visible delay before
            the button becomes interactive. */}
        <link rel='preconnect' href='https://accounts.google.com' />
        <link rel='dns-prefetch' href='https://accounts.google.com' />
        {/* Structured data so Google can understand what LibraryJi is (a
            SaaS application, not just a generic page) and who publishes it —
            genuinely true facts only (real name/contact/domain), never
            fabricated ratings/reviews, which Google's guidelines explicitly
            treat as spam and can trigger a manual action against the whole
            site. */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: SITE_NAME,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, Android',
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              offers: { '@type': 'Offer', category: 'SaaS' },
              areaServed: { '@type': 'Country', name: 'India' },
              publisher: {
                '@type': 'Organization',
                name: SITE_NAME,
                url: SITE_URL,
                email: 'support@libraryji.in',
                telephone: '+91-70697-63365',
              },
            }),
          }}
        />
        {/* {typeof window !== 'undefined' && <ThemeModeScript />} */}
      </head>
      <body className={`${manrope.className}`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange>
          <SWRProvider>
            <BrandingProvider>
              <MetaPixel />
              <ToastProvider>
                <AuthProvider>{children}</AuthProvider>
              </ToastProvider>
            </BrandingProvider>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
