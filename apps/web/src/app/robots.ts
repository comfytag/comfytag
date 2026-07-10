import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/checkout',
          '/tickets',
          '/profile',
          '/notifications',
          '/saved',
          '/my-following',
          '/claim-ticket',
          '/hype-link',
          '/reset-password',
          '/forgot-password',
          '/login',
          '/register',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://comfytag.com/sitemap.xml',
    host: 'https://comfytag.com',
  }
}
