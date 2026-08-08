'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr'

interface ThemeBranding {
  site_name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string | null
  secondary_color: string | null
}

interface BrandingContextValue {
  siteName: string
  /** Uploaded Logo URL from Admin Settings -> Theme, or null if none uploaded yet. */
  logoUrl: string | null
  /** Uploaded Favicon URL from Admin Settings -> Theme, or null if none uploaded yet. */
  faviconUrl: string | null
}

const defaults: BrandingContextValue = {
  siteName: 'LibraryJi',
  logoUrl: null,
  faviconUrl: null,
}

const BrandingContext = createContext<BrandingContextValue>(defaults)

/**
 * Single source of truth for platform branding (Logo + Favicon), fetched
 * once from the public `/theme` endpoint — reachable without auth so the
 * login/register screens and every panel (Super Admin, Admin, Staff) all
 * render the same uploaded assets instead of a hardcoded default. Falls
 * back to the bundled static logo/favicon until (or unless) something has
 * actually been uploaded in Admin Settings -> Theme.
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const { data } = useSWR<ThemeBranding>('/theme', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  const value: BrandingContextValue = {
    siteName: data?.site_name || defaults.siteName,
    logoUrl: data?.logo_url || null,
    faviconUrl: data?.favicon_url || null,
  }

  useEffect(() => {
    if (!value.faviconUrl) return
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = value.faviconUrl
  }, [value.faviconUrl])

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  return useContext(BrandingContext)
}
