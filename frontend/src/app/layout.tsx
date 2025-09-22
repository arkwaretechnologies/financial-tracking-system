import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SuperAdminAuthProvider } from '@/contexts/SuperAdminAuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Financial Tracking System',
  description: 'A comprehensive financial tracking and management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SuperAdminAuthProvider>
            {children}
          </SuperAdminAuthProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
