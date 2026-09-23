"use client"

export function AdminLogoutButton() {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch (e) {
      console.error("Logout failed", e)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border px-3 py-2 text-sm text-red-600 border-red-200 transition-colors hover:bg-red-50"
    >
      Cerrar sesión
    </button>
  )
}
