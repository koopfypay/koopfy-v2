
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/context/auth.context'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  title: 'Koopfy| Payment Gateway Dashboard',
  description: 'Global payment gateway admin panel for managing transactions, analytics, and payouts',
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}


