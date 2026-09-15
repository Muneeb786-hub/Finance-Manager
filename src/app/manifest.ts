import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Personal Finance Manager',
    short_name: 'Finance Manager',
    description: 'Personal finance, budgeting, savings milestones, and automated cash flow analytics.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/finance-manager-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
