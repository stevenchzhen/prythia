import type { Metadata } from 'next'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { TooltipProvider } from '@/components/ui/tooltip'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prythia — Prediction Market Intelligence',
  description:
    'Real-time aggregated prediction market data, AI analysis, and alerts for geopolitics, trade, economics, and more.',
  openGraph: {
    title: 'Prythia — Prediction Market Intelligence',
    description: 'Aggregated prediction market data with AI analysis.',
    url: 'https://app.prythia.com',
    siteName: 'Prythia',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <NuqsAdapter>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
