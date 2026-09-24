export const revalidate = 0 // Never cache this endpoint

const BUILD_INFO = {
  version: process.env.APP_VERSION || "3.7.0",
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  commit: process.env.GIT_COMMIT || "d6858b5",
  features: {
    entrenamiento: "v3.7.0 UPPER/LOWER ✅",
    nutricion: "v3.7.0 plan diario ✅",
    onboarding: "v2.0 wizard 4-pasos ✅",
  },
}

export async function GET() {
  return Response.json({
    version: BUILD_INFO.version,
    buildTime: BUILD_INFO.buildTime,
    commit: BUILD_INFO.commit,
    features: BUILD_INFO.features,
    timestamp: Date.now(),
  })
}
