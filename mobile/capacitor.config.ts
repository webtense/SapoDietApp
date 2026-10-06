import type { CapacitorConfig } from "@capacitor/cli"

// Shell fino: el WebView carga siempre https://sapofit.semillasdeti.com.
// Así la web (y cada release normal vía deploy.yml) llega al APK sin
// recompilar nada — la paridad web <-> Android es automática. `webDir`
// solo existe porque Capacitor exige una carpeta, nunca se sirve.
const config: CapacitorConfig = {
  appId: "com.semillasdeti.sapofit",
  appName: "SapoFit",
  webDir: "www",
  server: {
    url: "https://sapofit.semillasdeti.com",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
