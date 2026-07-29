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
