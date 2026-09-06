import type { MetadataRoute } from 'next'

const SITE_URL = 'https://libraryji.in'

// Only the genuinely public pages — everything else in this app either
// requires login (the admin/staff dashboard) or is a leftover template demo
// page (apps/*, utilities/*, icons/solar, sample-page) that was never meant
// to be public content. Listing those here (or letting them get crawled at
// all — see robots.txt) would dilute the site's topical relevance for the
// keywords that actually matter instead of helping rank for them.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/auth/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/auth/register`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/contact-us`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms-conditions`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/return-policy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/refund-cancellation-policy`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
