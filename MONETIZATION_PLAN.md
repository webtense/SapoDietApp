# 🚀 SapoFit Monetización — Plan de Difusión (Semana 1)

**Objetivo:** Medir demanda del mercado. KPI: 10+ signups en 7 días.

---

## 📹 Video Demo (60 seg)

### Instrucciones para grabar:
1. **Software:** OBS Studio (gratis) o ScreenFlow (Mac)
2. **Duración:** Exactamente 60 segundos
3. **FPS:** 30 fps, 1080p
4. **Audio:** Música de fondo + narración (opcional)

### Guion:
```
0-5 seg:   Pantalla inicio → "Empezar ahora"
5-15 seg:  Registro rápido (email/password)
15-25 seg: Hoy page → mostrar macros, KPIs, botones
25-35 seg: Entrenamientos → agregar máquina, progreso
35-50 seg: Admin dashboard → gráficas, métricas
50-60 seg: Call-to-action: "Regístrate gratis"
```

### Dónde subir:
- **YouTube:** Crear canal "SapoFit Pro" → subir video
- **TikTok:** Versión 15 seg (short)
- **Instagram Reels:** Versión 15 seg

### Embed en landing:
```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" title="SapoFit Demo"></iframe>
```

---

## 📱 Social Media Copy

### WhatsApp (grupos):
```
🥗 SapoFit Pro: Planes IA + Entrenamiento sin límites

✨ Qué lo diferencia:
• Planes personalizados con IA (ajustes automáticos)
• Tracking inteligente de macros y entrenamientos
• 100% offline — sincronización automática
• WhatsApp reminders (sin spam)
• €4,99/mes (sin sorpresas)

🎯 Prueba gratis 14 días:
https://sapofit.semillasdeti.com/landing
```

### Twitter/X:
```
🥗 Acabo de lanzar SapoFit Pro — un tracker de nutrición + entrenamientos con IA que aprende de ti.

✨ Planes automáticos según tus macros
✨ Entrenamientos tracked por máquina
✨ 100% offline
✨ €4,99/mes

Prueba: https://sapofit.semillasdeti.com/landing

#Fitness #IA #Nutrición #SapoFit
```

### Reddit (r/fitness, r/es):
```
Título: "Lancé SapoFit — un tracker de nutrición + entrenamientos con IA (€4,99/mes)"

Contenido:
He estado trabajando en esto los últimos meses. SapoFit es un tracker que:

• Genera planes de comida automáticos según objetivos/alergias (IA)
• Trackea máquinas y peso → rutinas automáticas
• Funciona 100% offline
• Alternativas IA de comidas (no te gusta? 3 opciones con mismos macros)
• WhatsApp reminders (no push notifications molestas)
• Precio justo: €4,99/mes

Prueba 14 días gratis: https://sapofit.semillasdeti.com/landing

Feedback bienvenido 🙌
```

### LinkedIn:
```
Lancé SapoFit Pro — un tracker de nutrición y entrenamientos con IA.

Pasé los últimos meses construyendo una herramienta que resuelve un problema que veía una y otra vez: hacer un plan de comidas inteligente es complejo, y la mayoría de apps no aprenden de ti.

SapoFit es diferente:
✅ Planes IA personalizados
✅ Entrenamientos inteligentes
✅ 100% offline (crucial cuando no hay WiFi en el gym)
✅ Precio honesto (€4,99/mes)

Estoy validando demanda de mercado con early adopters. Prueba gratis:
https://sapofit.semillasdeti.com/landing

#Startup #IA #Fitness #SaaS
```

### Facebook:
```
🎉 ¡NUEVO! SapoFit Pro está aquí

Un tracker de nutrición e entrenamientos que se adapta a ti:

✨ Planes IA personalizados (ajustes automáticos)
✨ Tracking de macros inteligente
✨ Rutinas de entrenamientos generadas automáticamente
✨ Modo offline 100% (entrena sin WiFi)
✨ Recordatorios por WhatsApp

Prueba 14 días GRATIS → https://sapofit.semillasdeti.com/landing

#Fitness #Nutrición #IA
```

---

## 📊 Plan de Difusión (7 días)

### Día 1 (Hoy):
- [ ] Subir video a YouTube (con enlace en landing)
- [ ] Post en Reddit (r/fitness + r/es)
- [ ] Tweet/X (main audience)
- [ ] LinkedIn post

### Día 2-3:
- [ ] WhatsApp a 5-10 grupos relevantes
- [ ] Facebook groups (fitness en español)
- [ ] Reposts/retweets de influencers (si responden)

### Día 4-5:
- [ ] TikTok/Instagram Reels (versión 15 seg del video)
- [ ] Follow-up emails a lista personal

### Día 6-7:
- [ ] Análisis de resultados
- [ ] Ajustes basados en feedback
- [ ] Preparar Fase 2 (si >10 signups)

---

## 📈 KPIs a Medir

**Google Analytics:**
- Vistas landing
- Signups (evento `sign_up` en GTM)
- Conversión: landing → signup (%)

**Manual:**
- Emails enviados
- Respuestas/comentarios
- Invitaciones directas a admin panel

**Meta:**
- Objetivo: 10+ signups
- Validación: ¿Hay demanda real?
- Siguiente paso si sí: Fase 3 (features, monetización)

---

## 🔧 Setup Technical

### Google Analytics 4 (GA4):
1. Crear propiedad GA4 en console.firebase.google.com
2. Reemplazar `G-XXXXXXXXXX` en landing/layout.tsx con tu ID real
3. Crear eventos personalizados:
   - `sign_up` (al registrarse)
   - `click_demo` (botón ver demo)
   - `click_share` (botones sociales)

### UTM Tracking:
```
Landing base:       https://sapofit.semillasdeti.com/landing
Desde Reddit:       https://sapofit.semillasdeti.com/landing?utm_source=reddit&utm_medium=social&utm_campaign=launch
Desde Twitter:      https://sapofit.semillasdeti.com/landing?utm_source=twitter&utm_medium=social&utm_campaign=launch
Desde WhatsApp:     https://sapofit.semillasdeti.com/landing?utm_source=whatsapp&utm_medium=social&utm_campaign=launch
```

---

## ✅ Checklist

- [ ] Video demo grabado (60 seg, YouTube)
- [ ] Landing actualizada con video + social share buttons
- [ ] Google Analytics configurado
- [ ] Copys de redes revisados
- [ ] UTM links creados
- [ ] Primer post en Reddit (Día 1)
- [ ] Tweet inicial (Día 1)
- [ ] LinkedIn post (Día 1)
- [ ] Revisar analytics Día 7
- [ ] Documentar learnings

---

## 🎯 Success Criteria

✅ **Éxito:** 10+ signups en 7 días  
⚠️ **Moderado:** 5-9 signups (iterar en copy)  
❌ **Necesita pivot:** <5 signups (problema de mercado/posicionamiento)

---

**Creado:** 30/09/2026  
**Responsable:** Andrés (SapoFit)  
**Revisión:** 07/10/2026 (Día 7 post-launch)
