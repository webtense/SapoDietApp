'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐸</span>
              <span className="font-bold text-xl text-emerald-700">SapoFit</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-700 hover:text-emerald-700 font-medium">
                Entrar
              </Link>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/login">Crear cuenta</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            🥗 Tu Entrenamiento + Nutrición en UNA App
          </h1>
          <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
            Planes IA personalizados, tracking de máquinas, modo offline. Todo sincronizado automáticamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100">
              <Link href="/login">Empezar gratis</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Ver demo (60 seg)
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
          Por qué SapoFit es diferente
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: '🤖', title: 'Planes IA', desc: 'La IA genera tus comidas según objetivos, alergias y presupuesto.' },
            { icon: '🏋️', title: 'Gym Smart', desc: 'Añade máquinas, trackea progreso de peso, genera rutinas automáticas.' },
            { icon: '📱', title: '100% Offline', desc: 'Entrena sin WiFi. Los datos se sincronizan solos cuando vuelva la conexión.' },
            { icon: '🔔', title: 'Notificaciones Smart', desc: 'Recordatorios push semanales de peso, entrenamientos y progreso.' },
            { icon: '💰', title: 'Precio honesto', desc: '€4,99/mes. Sin sorpresas, sin premium escondido, cancel cuando quieras.' },
            { icon: '📊', title: 'Gráficos Reales', desc: 'Visualiza tu peso de 30 días, progresión de máquinas y análisis nutricional.' },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-emerald-700 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video Demo */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">
            Mira cómo funciona
          </h2>
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-black">
            <video
              width="100%"
              height="auto"
              controls
              className="w-full"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1920'%3E%3Crect fill='%2310b981' width='1080' height='1920'/%3E%3Ctext x='540' y='960' font-size='120' fill='white' text-anchor='middle' dominant-baseline='middle'%3E▶ SapoFit Demo%3C/text%3E%3C/svg%3E"
            >
              <source src="/videos/sapofit-marketing.mp4" type="video/mp4" />
              Tu navegador no soporta videos HTML5.
            </video>
          </div>
          <p className="text-gray-600 mt-8 text-lg">
            Crear plan → Trackear máquinas → Recibir alternativas → Sincronizar offline
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Planes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 mb-6 text-sm">Prueba 14 días</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-emerald-700">€0</span>
                <span className="text-gray-600">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['1 plan por mes', 'Tracking básico', 'Offline mode', 'Sin IA alternatives'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full">
                <Link href="/login">Empezar ahora</Link>
              </Button>
            </div>

            {/* Pro (Popular) */}
            <div className="bg-white rounded-2xl p-8 border-2 border-emerald-600 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                ⭐ Popular
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <p className="text-emerald-600 mb-6 text-sm font-medium">Lo que necesitas</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-emerald-700">€4,99</span>
                <span className="text-gray-600">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Planes ilimitados', 'IA alternatives', 'WhatsApp reminders', 'Análisis nutricional', 'Reportes semanales'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href="/login">Activar Pro</Link>
              </Button>
            </div>

            {/* Coach */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Coach</h3>
              <p className="text-gray-600 mb-6 text-sm">Para entrenadores</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-emerald-700">€9,99</span>
                <span className="text-gray-600">/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Todo de Pro', 'Gestiona clientes', 'Dashboard admin', 'Reportes PDF', 'Soporte prioritario'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full">
                <Link href="/login">Saber más</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Sé de los primeros</h2>
          <p className="text-xl text-emerald-50 mb-8">
            Únete a nuestra lista de espera. Acceso anticipado + 50% descuento primer mes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
            />
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-gray-100">
              Apuntarme
            </Button>
          </div>
          <p className="text-sm text-emerald-100 mt-4">Sin spam. Cancelar en cualquier momento.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <p>© 2026 SapoFit • Privacidad • Términos • Made in Spain 🇪🇸</p>
      </footer>
    </div>
  )
}
