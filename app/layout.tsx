import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { PwaRegister } from '@/components/pwa-register'
import { PWAInstaller } from '@/components/pwa-installer'
import { VersionManager } from '@/components/version-manager'
import { VersionFooter } from '@/components/version-footer'
import { APP_VERSION, BUILD_ID } from '@/lib/version'
import './globals.css'

export const metadata: Metadata = {
  title: 'SapoFit',
  description: 'Planificador de nutrición, entrenamiento y seguimiento diario',
  generator: 'SapoFit',
  manifest: `/manifest.json?v=${BUILD_ID}`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SapoFit',
  },
  icons: {
    apple: [
      { url: `/icon-192.png?v=${BUILD_ID}`, sizes: '192x192', type: 'image/png' },
      { url: `/icon-512.png?v=${BUILD_ID}`, sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="app-version" content={APP_VERSION} />
        <meta name="build-commit" content={BUILD_ID} />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} flex flex-col min-h-screen`}>
        <div className="flex-1">{children}</div>

        <footer className="border-t bg-gray-50 p-4 text-center">
          <VersionFooter />
        </footer>

        <PwaRegister />
        <PWAInstaller />
        <VersionManager />

        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
