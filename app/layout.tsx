import './globals.css'
import './nupoo-polish.css'
import type { Metadata, Viewport } from 'next'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Nupoo — blokový editor',
  description: 'Rychlý lokální Notion-like blokový editor.',
  applicationName: 'Nupoo',
  manifest: '/nupoo/manifest.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
