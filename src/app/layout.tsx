import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './css/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { BrandingProvider } from '@/context/BrandingContext'
import SWRProvider from '@/components/providers/SWRProvider'

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LibraryJi',
  description: 'LibraryJi — Library & Study Room Management',
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
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Single favicon link, id'd so BrandingContext can reliably find and update it. */}
        <link id='app-favicon' rel='icon' href='/favicon.svg' type='image/svg+xml' />
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
