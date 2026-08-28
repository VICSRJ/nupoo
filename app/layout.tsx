import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nupoo', description: 'Notion-like block editor' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
