import packageJson from '../package.json'

export const APP_VERSION = packageJson.version
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || `${APP_VERSION}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
export const RELEASE_LABEL = "octubre 2026 — Newsletter, Analytics, Export, Autoupdate fiable"

export function getReleaseMonth(): string {
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return months[new Date().getMonth()]
}
