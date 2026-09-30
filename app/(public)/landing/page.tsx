"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Share2, Play, CheckCircle } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [showSignup, setShowSignup] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Analytics: página vista
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_title: "SapoFit Landing",
        page_path: "/landing",
      })
    }
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al registrarse")
      }

      // Analytics: signup
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "sign_up", { method: "email" })
      }

      setSuccess(true)
      setFormData({ email: "", password: "", confirmPassword: "" })

      setTimeout(() => {
        router.push("/login")
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  const shareUrl = "https://sapofit.semillasdeti.com/landing"
  const shareText = "🥗 SapoFit Pro: Planes IA + Entrenamiento sin límites. Tracker inteligente con IA, offline-first y €4,99/mes"

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("SapoFit Pro")}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">🥗 SapoFit Pro</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-95">Planes IA + Entrenamiento Sin Límites</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100"
              onClick={() => setShowSignup(true)}
            >
              Empezar ahora
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
              Ver demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Por qué SapoFit es diferente</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "🤖", title: "Planes IA", desc: "La IA genera comidas según objetivos, alergias y presupuesto" },
              { icon: "🏋️", title: "Gym Smart", desc: "Trackea máquinas y genera rutinas automáticas" },
              { icon: "📱", title: "100% Offline", desc: "Entrena sin WiFi, sincronización automática" },
              { icon: "💬", title: "WhatsApp Pro", desc: "Recordatorios automáticos sin notificaciones molestas" },
              { icon: "💰", title: "Precio honesto", desc: "€4,99/mes, sin sorpresas" },
              { icon: "🔄", title: "Alternativas IA", desc: "No te gusta la comida → 3 opciones con mismas macros" },
            ].map((feature, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-lg text-emerald-600 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Mira cómo funciona (60 seg)</h2>
          <div className="relative mb-8">
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-white mx-auto mb-4" />
                <p className="text-white text-lg">Video demo: Registro → Hoy → Entrenamientos → Admin</p>
                <p className="text-gray-400 text-sm mt-2">*Próximamente en YouTube</p>
              </div>
            </div>
            <div className="mt-6 grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl mb-2">📝</div>
                <p className="text-sm font-semibold">Registro</p>
              </div>
              <div>
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm font-semibold">Hoy (Macros)</p>
              </div>
              <div>
                <div className="text-2xl mb-2">💪</div>
                <p className="text-sm font-semibold">Entrenamientos</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-sm font-semibold">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-white rounded-lg p-8 border-2 border-emerald-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5" /> Comparte SapoFit
            </h3>
            <p className="text-gray-600 mb-6">Ayuda a otros a descubrir nutrición inteligente:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-green-500 hover:bg-green-600 text-white rounded font-semibold text-sm text-center transition"
              >
                WhatsApp
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-blue-400 hover:bg-blue-500 text-white rounded font-semibold text-sm text-center transition"
              >
                Twitter
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm text-center transition"
              >
                Facebook
              </a>
              <a
                href={shareLinks.reddit}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded font-semibold text-sm text-center transition"
              >
                Reddit
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold text-sm text-center transition"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Planes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-2">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-gray-500 mb-4">Prueba 14 días</p>
              <div className="text-3xl font-bold text-emerald-600 mb-6">€0/mes</div>
              <ul className="space-y-3 mb-8 text-sm">
                {["1 plan por mes", "Tracking básico", "Offline mode", "Sin IA alternatives"].map((feature) => (
                  <li key={feature} className="text-gray-600">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => setShowSignup(true)}>
                Empezar
              </Button>
            </Card>

            <Card className="p-8 border-2 border-emerald-500 bg-emerald-50">
              <div className="text-sm text-emerald-600 font-bold mb-2">⭐ POPULAR</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-emerald-600 mb-4">Lo que necesitas</p>
              <div className="text-3xl font-bold text-emerald-600 mb-6">€4,99/mes</div>
              <ul className="space-y-3 mb-8 text-sm">
                {["Planes ilimitados", "IA alternatives", "WhatsApp reminders", "Análisis nutricional", "Reportes semanales"].map(
                  (feature) => (
                    <li key={feature} className="text-gray-600">
                      ✓ {feature}
                    </li>
                  )
                )}
              </ul>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowSignup(true)}>
                Activar Pro
              </Button>
            </Card>

            <Card className="p-8 border-2">
              <h3 className="text-2xl font-bold mb-2">Coach</h3>
              <p className="text-gray-500 mb-4">Para entrenadores</p>
              <div className="text-3xl font-bold text-emerald-600 mb-6">€9,99/mes</div>
              <ul className="space-y-3 mb-8 text-sm">
                {["Todo de Pro", "Gestiona clientes", "Dashboard admin", "Reportes PDF", "Soporte prioritario"].map(
                  (feature) => (
                    <li key={feature} className="text-gray-600">
                      ✓ {feature}
                    </li>
                  )
                )}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => setShowSignup(true)}>
                Saber más
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-2">Sé de los primeros</h2>
              <p className="text-gray-600 mb-6">Crea tu cuenta y accede a SapoFit hoy mismo</p>

              {success ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-emerald-800 font-semibold">¡Bienvenido a SapoFit!</p>
                  <p className="text-sm text-emerald-700 mt-2">Redirigiendo al login...</p>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      placeholder="Mín. 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Confirmar contraseña</Label>
                    <Input
                      type="password"
                      placeholder="Repite la contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? "Registrándose..." : "Crear cuenta"}
                  </Button>

                  <p className="text-xs text-center text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-emerald-600 hover:underline font-semibold">
                      Inicia sesión aquí
                    </Link>
                  </p>
                </form>
              )}

              <button
                onClick={() => setShowSignup(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-8 px-4">
        <p>© 2026 SapoFit • Hecho en España 🇪🇸</p>
      </footer>
    </div>
  )
}
