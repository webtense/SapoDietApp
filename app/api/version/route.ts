export const revalidate = 0 // No cache, siempre fresco

export async function GET() {
  // Lee la versión desde package.json
  const version = process.env.npm_package_version || "3.7.0"
  const buildTime = new Date().toISOString()

  return Response.json({
    version,
    buildTime,
    timestamp: Date.now(),
  })
}
