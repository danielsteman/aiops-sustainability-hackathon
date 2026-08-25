import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AIOps Sustainability Hackathon',
  description:
    'Client-only Next.js harness for the AIOps sustainability hackathon.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
