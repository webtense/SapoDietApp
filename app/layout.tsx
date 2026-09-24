import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { PwaRegister } from '@/components/pwa-register'
import { PwaInstaller } from '@/components/pwa-installer'
import { VersionManager } from '@/components/version-manager'
import { VersionFooter } from '@/components/version-footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'SapoFit',
  description: 'Planificador de nutrición, entrenamiento y seguimiento diario',
  generator: 'SapoFit',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SapoFit',
  },
  icons: {
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
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
  const cacheBuster = "d6858b5" // git commit hash para cache-busting

  return (
    <html lang="es">
      <head>
        {/* Meta tags de versión para cache-busting y detección de updates */}
        <meta name="app-version" content="3.7.0" />
        <meta name="build-time" content={new Date().toISOString()} />
        <meta name="build-commit" content={cacheBuster} />

        {/* Cache-busting en URLs críticas */}
        <link rel="manifest" href={`/manifest.json?v=${cacheBuster}`} />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} flex flex-col min-h-screen`}>
        <div className="flex-1">{children}</div>

        {/* Footer con versión clickeable */}
        <footer className="border-t bg-gray-50 p-4 text-center">
          <VersionFooter />
        </footer>

        {/* Service Worker + Version Manager + PWA Installer */}
        <PwaRegister />
        <PwaInstaller />
        <VersionManager />

        <Toaster richColors position="top-right" />
        <Analytics />

        {/* Script para registrar Service Worker mejorado */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
                console.log('✅ Service Worker registered');
                // Check for updates cada 1 hora
                setInterval(() => reg.update().catch(console.error), 3600000);
              }).catch(err => {
                console.error('❌ Service Worker registration failed:', err);
              });
            }
          `
        }} />
      </body>
    </html>
  )
}
