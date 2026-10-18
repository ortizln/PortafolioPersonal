# Cambios Realizados — Sesión Actual

## Fase 2 — Experiencia de Usuario (UX)

### `portfolio.component.ts` + `.scss` — Loading Skeletons
- Reemplazado spinner simple por **skeleton placeholders** que imitan la estructura del hero y las secciones
- Shimmer animation con gradiente animado
- 3 bloques de skeleton: hero (avatar + líneas + botones), secciones (líneas de ancho variable)

### `experience-section.component.ts` + `.scss` — Timeline LinkedIn
- **Rediseño completo**: avatar con inicial de empresa (gradient), línea vertical conectora, dot activo cuando es trabajo actual
- Diseño tipo LinkedIn: avatar a la izquierda, contenido a la derecha
- Logros con bullets decorativos
- Tecnologías usadas como tags
- Badge "Actual" para trabajo vigente
- Hover sutil en cards

### `projects-section.component.ts` + `.scss` — Galería con Filtros
- **Añadidos filtros** por tecnología: botones "Todos" + tecnologías únicas extraídas de los proyectos
- Filtro activo resaltado (background accent)
- `filteredProjects` getter que filtra en tiempo real
- Animaciones AOS preservadas

### Traducción completa a español
- **About**: "Sobre Mí", "Conóceme", "Hola, soy", "Especialidades"
- **Education**: "Educación", "Formación Académica"
- **Certifications**: "Certificaciones", "Licencias y Certificaciones"
- **Skills**: "Habilidades", "Competencias Técnicas"
- **Languages**: "Idiomas", "Nivel de Idiomas"
- **Contact**: Formulario completo (labels, placeholders, errores, botón, éxito) en español
- **Experience**: "Trayectoria", "Experiencia Laboral", "Actualidad", "Logros"
- **Projects**: "Portafolio", "Proyectos Destacados", "Demo", "Código", "Destacado"
- **Nav**: "Inicio", "Sobre Mí", "Experiencia", "Proyectos", "Skills", "Contacto"
- **Footer**: textos en español

### Estados de botones
- Botón de contacto tiene estado **loading** (`sending`) con spinner de hourglass
- Botón se deshabilita mientras se envía o si el formulario es inválido (`[disabled]="contactForm.invalid || sending"`)
- Botón "Reintentar" en estado de error

---

## Fase 1 — Modernización Visual Completa

### `frontend/src/styles/_theme.scss` — Nueva paleta de colores
- **Dark theme**: Deep midnight (`#08080f`) con acentos Indigo (`#818cf8`) + Purple (`#a855f7`)
- **Light theme**: Clean white (`#fafafa`) con acentos Indigo (`#6366f1`) + Purple (`#7c3aed`)
- **Tipografía**: Headings ahora usan `Outfit` (variable `--font-heading`), body `Inter`

### `frontend/src/index.html` — Fuentes y meta
- Añadida fuente **Outfit** (900, 800, 700, 600, 500, 400) desde Google Fonts
- Título actualizado a "DevBlackSheep | Portfolio"
- Añadido meta description

### `frontend/src/app/shared/layout/public-layout.component.ts` — Navbar + Footer
- **Eliminado** botón de Admin de la navbar pública (el usuario nunca debe saber que existe /admin)
- **Footer rediseñado** con 4 columnas: Brand + descripción, Navegación (Inicio, Sobre Mí, Proyectos, Contacto), Contacto (ubicación, email, CV), Tecnologías (Angular, Node.js, PostgreSQL, TypeScript, Docker, Prisma)
- Barra inferior: Copyright + versión del sistema (v2.0.0)
- **NavLinks actualizados** a rutas limpias sin prefijo `/portfolio` (ej: `/about` en vez de `/portfolio/about`), etiquetas en español

### `frontend/src/app/shared/layout/public-layout.component.scss` — Estilos navbar + footer
- Eliminados estilos de `.btn-admin`
- Nuevo footer con grid responsivo, gradientes decorativos, glassmorphism, hover effects

### `frontend/src/app/public-portfolio/sections/hero-section.component.ts` — Hero
- **Reemplazadas partículas** (20 dots flotantes) por **3 gradient orbs** animados con CSS (indigo, purple, blur)
- **Eliminado typing effect** character-by-character, reemplazado por título estático con cursor blink sutil
- Añadido **RouterLink** para import de navegación
- Añadido **botón secundario** "Contáctame" junto al CV
- Textos en español
- Animaciones con `data-aos` (zoom-in en foto, fade-up secuencial en texto, botones, stats)

### `frontend/src/app/public-portfolio/sections/hero-section.component.scss` — Estilos hero
- Gradiente sutil de fondo con 3 orbes flotantes (blur 80px)
- Marco de foto con borde gradient + glow
- Tipografía heading en `Outfit` con letter-spacing negativo
- Botones primary (gradient) + secondary (outline)
- Scroll indicator refinado (más pequeño, opaco)
- Responsive mejorado (acciones en columna en mobile)

---

## Angular — Production Build

### `frontend/angular.json`
- **Añadido** `fileReplacements` en la configuración `production`:
  ```json
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    }
  ]
  ```
  **Problema:** El build production usaba `environment.ts` (dev) con `apiUrl: 'http://localhost:3000/api'`, causando que las llamadas API fueran a `localhost:3000` directo en vez de pasar por el proxy nginx (`/portfolio/api`).

### `frontend/src/app/app.routes.ts`
- **Cambiada** la ruta raíz de `{ path: '', redirectTo: 'portfolio', pathMatch: 'full' }` a cargar `PublicLayoutComponent` directamente en `path: ''`
- **Añadida** redirección de `/portfolio` → `''` para backward compatibility
- **Cambiado** `{ path: '**', redirectTo: 'portfolio' }` → `{ path: '**', redirectTo: '' }`
  **Problema:** Con `baseHref="/portfolio/"`, la ruta `portfolio` producía URL duplicada: `/portfolio/portfolio`.

---

## Sesiones Anteriores (resumen)

### AboutPageComponent
- Añadidos imports `NgFor` y `NgClass` faltantes (solo importaba `NgIf`)

### Refresh token 500
- Wrapped `verifyRefreshToken()` en try-catch en `refreshToken()` y `logout()` del controller

### Disabled attribute warnings
- Reemplazados `[disabled]` en templates por `valueChanges` subscriptions con `.disable()`/`.enable()`

### Contact Messages route
- Corregida ruta en sidebar de `/admin/contact-messages` a `/admin/messages`

### Settings page
- Añadido try-catch en `loadSettings()` para localStorage corrupto

### Autocomplete=off
- Añadido a todos los `<form>` y contenedores `glass-form`

### Project API
- `createProject`/`updateProject`/`getProjectById`: añadido `.pipe(map(r => r.project))` para unwrap
- Modelos: `Project.id`, `ProjectImage.id`, `ProjectImage.projectId` cambiados de `number` a `string` (UUID)
- `getPrimaryImage()`: ahora antepone `environment.uploadUrl`
- API service: todos los params `id` cambiados de `number` a `string`
- Eliminados casts `Number(img.projectId)` en `removeImage()` y `setPrimary()`

### Deploy
- Eliminado paso de nginx del deploy script (se maneja manual en control-servidor)
- `baseHref` fijado a `/portfolio/` en angular.json production
- `environment.prod.ts`: `apiUrl` → `/portfolio/api`, `uploadUrl` → `/portfolio/uploads`

### README.md
- Reescribido completamente con análisis y resumen total del sistema

---

## Ampliación funcional — Noticias, Chatbot y Cotizaciones (Fases A–E)

### Fase A — Noticias en Home
- `public-portfolio/portfolio.component.ts|html|scss`: sección "Nuevas noticias" con 1 post destacado + 2 secundarios, badge "Nuevo" y chip de categoría, con fallback de imagen (`onPostImageError`).
- Consumo de `GET /api/public/blog?limit=3`.

### Fase B — Chatbot flotante
- `shared/components/chat-widget.component.ts|scss`: burbuja + panel, máquina de estados determinista (`start` / `services` / `projects` / `faq` / `handoff` + flujo de cotización `q_type → q_desc → q_features → q_budget → q_name → q_email → q_summary → q_submit → q_done` / `q_error`), indicador de "escribiendo", respuestas rápidas y cierre con **Esc**.
- Montado en `public-layout`; botón `.back-to-top` movido a la izquierda.

### Fase C — Persistencia, API y CRM
- **Prisma**: modelos `ChatSession`, `ChatMessage`, `QuoteRequest`, `ChatHandoff` + enums; migración `20261016220822_add_chat_quote_tables`.
- **Backend**: `services/whatsapp.service.js` (puente OpenWA con fallback a enlaces `wa.me`), `middlewares/chatAuth.js` (token anónimo vía cabecera `x-chat-token`, hash sha256), `helpers/notify.js`.
- **Controladores**: `chat.controller.js`, `quote.controller.js`, `whatsapp.controller.js` y rutas públicas/admin (`/api/public/chat`, `/api/public/quotes`, `/api/admin/chat`, `/api/admin/quotes`, `/api/integrations/whatsapp`).
- **Rate limiting**: `chatLimiter` (60/15min) y `quoteLimiter` (10/hora).
- **Widget**: sesión persistida en `sessionStorage` (`alantek-chat-session`), historial restaurado al reabrir, envío de cotización con código `COT-YYYYMMDD-XXXX` y escalado a WhatsApp (`requestChatHandoff`).
- **Frontend core**: métodos de chat/cotización en `core/services/api.service.ts` y modelos en `core/models/index.ts`.

### Fase C4 — Vistas de administración
- `chat/chat-admin.component.*`: master-detail de conversaciones, polling cada 20s, respuesta como agente, cambio de estado, asignación y aceptar/cerrar handoff.
- `quotes/quote-list.component.*`: listado con filtros por estado, búsqueda, paginación y modal de detalle/edición/eliminación.
- Rutas `/admin/chats` y `/admin/quotes` (permiso `messages.read`) + entradas de sidebar "Chats" y "Cotizaciones".

### Fase D — Escalado a WhatsApp
- `POST /api/integrations/whatsapp/webhook` (OpenWA) con verificación opcional por `x-openwa-secret`; crea/retoma sesión con hash sintético `wa:<número>` e ingestión de mensajes entrantes.
- Verificación E2E (Playwright): flujo completo de cotización, persistencia (18 mensajes), creación de cotización, apertura de WhatsApp con el número `593986056366` y handoff en estado `REQUESTED`.

### Fase E — SEO / accesibilidad / build
- SEO cubierto por `SeoService` en páginas públicas y layout; ARIA y cierre con **Esc** en el widget.
- `ng build` productivo **OK** (sin errores); verificación E2E **11/11** y handoff **7/7** con 0 errores de consola.

### Notificaciones por email (plan #21)
- `helpers/mailer.js`: plantillas HTML corporativas ALANTEK (`renderEmail` / `sendTemplate`, paleta verde/cobre), con degradación a consola cuando no hay `SMTP_HOST` configurado.
- `helpers/notify.js`: `notifyAdmins` ahora crea la notificación in-app **y** envía un correo a los administradores (destinatarios = `ADMIN_NOTIFY_EMAIL` o los emails de los usuarios activos).
- Correos transaccionales conectados:
  - **Contacto** (`contact.controller.js`): confirmación al remitente + aviso a administradores.
  - **Cotización** (`quote.controller.js`): confirmación con referencia `COT-…` y resumen + aviso a administradores.
  - **Asesor en chat** (`chat.controller.js`): confirmación al visitante (si dejó correo) + aviso a administradores.
  - **Recuperación de contraseña** (`auth.controller.js`): plantilla de marca con botón de acción.
- `contact.controller.js`: eliminada la función `notifyAdmins` local duplicada (ahora usa el helper compartido).
- Variables nuevas en `.env` / `.env.example`: `SMTP_SECURE`, `SMTP_FROM`, `PUBLIC_BASE_URL`, `ADMIN_NOTIFY_EMAIL`, `NOTIFY_EMAIL_ENABLED`.
- Tests: `test/unit/memberScope.test.js` alineado con RBAC (`roles[]`); suite backend **30/30** en verde.

### Pruebas E2E permanentes (Fase 7)
- Nueva suite `e2e/tests/chat-quote.spec.ts`: flujo de cotización del chatbot (genera referencia `COT-…`), persistencia de la sesión tras recargar, handoff a WhatsApp (registra el POST `/public/chat/sessions/:id/handoff` y abre el popup) y las vistas admin `/admin/quotes` y `/admin/chats`.
- `e2e/playwright.config.ts`: `serve-dist.js` ahora usa el puerto **4210** (evita el 4200 del otro proyecto) y `baseURL` con barra final.
- `e2e/serve-dist.js`: reescribe la cabecera `Origin` a un origen permitido por CORS (`PROXY_ORIGIN`, por defecto `http://localhost:4300`), de modo que el proxy de pruebas supera el CORS del backend sin modificarlo.
- `e2e/tests/public.spec.ts`: selectores del blog corregidos (`a.card-blog` y click sobre la tarjeta); estaban desactualizados.
- Suite completa E2E: **14/14** (`npm test` en `e2e/`).
