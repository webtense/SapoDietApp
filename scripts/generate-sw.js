// Inyecta el buildId de este release en public/sw.js a partir de
// public/sw.template.js, para que el CACHE_NAME cambie en cada build y el
// navegador reinstale el service worker. Se ejecuta automáticamente antes de
// `npm run build` (hook "prebuild").
const fs = require("fs")
const path = require("path")

const pkg = require("../package.json")

function resolveBuildId() {
  if (process.env.NEXT_PUBLIC_BUILD_ID) return process.env.NEXT_PUBLIC_BUILD_ID
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  return `${pkg.version}-${today}`
}

const buildId = resolveBuildId()
const templatePath = path.join(__dirname, "..", "public", "sw.template.js")
const outputPath = path.join(__dirname, "..", "public", "sw.js")

const template = fs.readFileSync(templatePath, "utf8")
const output = template.replace(/__BUILD_ID__/g, buildId)

fs.writeFileSync(outputPath, output)
console.log(`[generate-sw] public/sw.js generado con CACHE_NAME sapofit-${buildId}`)
