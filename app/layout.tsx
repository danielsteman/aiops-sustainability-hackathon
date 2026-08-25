import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const sourceSans3 = localFont({
  src: [
    { path: './fonts/source-sans-3-300.ttf', weight: '300' },
    { path: './fonts/source-sans-3-600.ttf', weight: '600' },
    { path: './fonts/source-sans-3-700.ttf', weight: '700' },
  ],
  variable: '--font-source-sans-3',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AIOps Sustainability Hackathon',
  description:
    'Client-only Next.js harness for the AIOps sustainability hackathon.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${sourceSans3.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
