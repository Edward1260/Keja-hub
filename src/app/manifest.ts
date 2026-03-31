import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NairobiPad | Smart Property Management',
    short_name: 'NairobiPad',
    description: 'AI-Powered Property + Rental Ecosystem for Students and Professionals',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff9f2',
    theme_color: '#f59e0b',
    icons: [
      {
        src: 'https://www.gstatic.com/monospace/250314/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://www.gstatic.com/monospace/250314/macos-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
