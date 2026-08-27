import './globals.css'
import type { Metadata } from 'next'
export const metadata:Metadata={title:'Nupoo',description:'Notion-like block editor'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="cs"><body>{children}</body></html>}
