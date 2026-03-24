import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './app.css'

export const metadata: Metadata = {
  title: 'Agent Dragon Inn',
  description: 'The OS for your AI agent workforce',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
