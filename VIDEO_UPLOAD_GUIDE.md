# 📹 SapoFit Demo Video — Guía de Subida a YouTube

**Video generado:** `public/sapofit_demo.mp4` (204 KB, 60 segundos)

---

## 📋 Pasos para subir a YouTube

### 1. **Crear/Acceder a tu canal YouTube**
   - Ir a https://www.youtube.com
   - Click en tu perfil → "Crear canal" (si no tienes)
   - Nombre sugerido: "SapoFit Pro"

### 2. **Subir el video**
   - Click en **"Crear"** (icono de cámara superior derecha)
   - Seleccionar **"Subir un video"**
   - **Arrastrar** `public/sapofit_demo.mp4` o seleccionar archivo
   - **Esperar** a que suba (2-3 min por 204 KB)

### 3. **Configurar detalles**
   - **Título:** `SapoFit Pro — Planes IA + Entrenamientos (Demo)`
   - **Descripción:**
   ```
   🥗 SapoFit Pro: Planificador de nutrición e entrenamientos con IA

   ✨ Características:
   • Planes IA personalizados
   • Tracking inteligente de macros
   • Entrenamientos con seguimiento de máquinas
   • 100% offline
   • €4,99/mes

   🎯 Prueba gratis: https://sapofit.semillasdeti.com/landing

   #Fitness #IA #Nutrición #SaaS #Startup
   ```
   - **Privacidad:** Seleccionar **"No listado"** (solo quien tenga link)
   - **Categoría:** Fitness/Deporte

### 4. **Publicar**
   - Click en **"PUBLICAR"**
   - Esperar confirmación

### 5. **Obtener embed link**
   - Una vez publicado, copiar URL: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Click en **"Compartir"**
   - Copiar el código embebido (HTML)

### 6. **Reemplazar en landing**
   - Abrir `app/(public)/landing/page.tsx`
   - Buscar: `<div className="aspect-video bg-black...`
   - Reemplazar con:
   ```jsx
   <iframe
     width="100%"
     height="600"
     src="https://www.youtube.com/embed/VIDEO_ID"
     title="SapoFit Demo"
     frameBorder="0"
     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
     allowFullScreen
     className="rounded-lg"
   ></iframe>
   ```

### 7. **Actualizar Google Analytics ID**
   - Ir a https://console.firebase.google.com
   - Crear proyecto "SapoFit" (si no existe)
   - Copiar **Google Analytics Property ID** (formato: `G-XXXXXXXXXX`)
   - Reemplazar en:
     - `app/layout.tsx` (línea ~26)
     - `app/(public)/landing/page.tsx` (línea ~12)

### 8. **Commit y deploy**
   ```bash
   git add -A
   git commit -m "Agregar demo video + Google Analytics ID"
   git push origin main
   ```

---

## 🔗 Links para la landing

Una vez tengas el VIDEO_ID, usa estos links:

**Video embed:**
```html
https://www.youtube.com/embed/VIDEO_ID
```

**Compartir:**
- WhatsApp: `https://wa.me/?text=...&https://sapofit.semillasdeti.com/landing`
- Twitter: `https://twitter.com/intent/tweet?text=...&url=https://sapofit.semillasdeti.com/landing`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=https://sapofit.semillasdeti.com/landing`

---

## ⚠️ Notas importantes

- **VIDEO_ID** es la parte después de `v=` en la URL
  - Ejemplo: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → ID = `dQw4w9WgXcQ`
- El video está en "No listado" para privacidad (solo quien tenga el link puede verlo)
- Una vez publicado, **no aparecerá en búsquedas públicas de YouTube**
- Si cambias a "Público" más tarde, aparecerá en búsquedas

---

## 📊 Próximo paso

Después de subir:
1. Obtener VIDEO_ID
2. Actualizar landing con embed
3. Comenzar difusión en redes sociales (según MONETIZATION_PLAN.md)
4. Revisar Google Analytics cada día (7 días)

---

**Duración del video:** 60 segundos exactos  
**Tamaño:** 204 KB  
**Resolución:** 1280x720 (HD)  
**FPS:** 30 fps

✅ Listo para subir!
