# Estado de la Aplicación — Portafolio Personal (DevBlackSheep)

> Documento de estado y funcionalidades del portafolio completo. Actualizado al final de la última sesión de trabajo.

---

## 1. Resumen General

Aplicación full-stack de portafolio profesional con:

- **Panel público** (SPA): portafolio visual en español, oscuro/claro, con 9 secciones.
- **Panel de administración** (`/admin`): CRUD completo de todos los contenidos con autenticación JWT.
- **API REST** documentada con Swagger.
- **Base de datos** PostgreSQL 16 gestionada con Prisma ORM.
- **Despliegue** en servidor Ubuntu con Nginx + Docker Compose.

```
Usuario → Nginx (192.168.100.215)
           ├── /portfolio/       → Angular SPA (estática, servida por Nginx)
           ├── /portfolio/api/   → Backend Express (:3000, Docker)
           └── /portfolio/uploads→ Archivos estáticos (imágenes, PDFs)
```

---

## 2. Stack Tecnológico

| Capa | Tecnologías | Versión |
|------|-------------|---------|
| Frontend | Angular (standalone, lazy loading) | 18.2 |
| Frontend | Bootstrap 5.3, Angular Material, Chart.js, AOS, RxJS | — |
| Backend | Node.js + Express | 20 / 4.21 |
| Backend | Prisma ORM + PostgreSQL | 5.22 / 16 |
| Backend | JWT (HS256), bcryptjs, Multer + Sharp, Helmet | — |
| Deploy | Nginx + Docker Compose, servidor Ubuntu | — |

---

## 3. Arquitectura del Backend

### 3.1 Middleware (orden en `app.js`)

Helmet (CSP) → Compression → CORS (env `CORS_ORIGIN`) → JSON (1mb) → URL-encoded → Morgan → Rate limiting → Static `/uploads` → Swagger `/api-docs` → Rutas → Health `/api/health` → Error handler.

### 3.2 Endpoints de la API (18 módulos)

| Mount Point | Módulo | Uso |
|-------------|--------|-----|
| `/api/auth` | auth.routes | Login, registro, refresh token, logout |
| `/api/users` | user.routes | Gestión de usuarios |
| `/api/profile` | profile.routes | Perfil público (datos, imagen, CV) |
| `/api/experiences` | experience.routes | Experiencia laboral |
| `/api/education` | education.routes | Educación |
| `/api/certifications` | certification.routes | Certificados + archivos (PDF/imagen) |
| `/api/projects` | project.routes | Proyectos |
| `/api/skills` | skill.routes | Habilidades |
| `/api/languages` | language.routes | Idiomas |
| `/api/social-links` | socialLink.routes | Redes sociales |
| `/api/repositories` | repository.routes | Repositorios |
| `/api/categories` | category.routes | Categorías |
| `/api/contact` | contact.routes | Mensajes de contacto |
| `/api/uploads` | upload.routes | Subida de archivos |
| `/api/settings` | setting.routes | Ajustes |
| `/api/technologies` | technology.routes | Catálogo de tecnologías |
| `/api/public` | public.routes | Datos públicos del portafolio |
| `/api/stats` | stats.routes | Estadísticas |

**Extras:** `GET /api/health`, `GET /uploads/*` (estáticos), Swagger UI en `/api-docs`.

### 3.3 Base de Datos (19 modelos)

Entidades principales con **IDs UUID (string)**, `createdAt`/`updatedAt` y soft delete (`deletedAt`):

- **User** — usuarios (email, password, role ADMIN/USER, refreshToken)
- **Profile** — datos públicos (quickStats JSON, imagen, banner, CV)
- **Experience** — empleos (achievements JSON, technologies String[], current)
- **Education** — formación (level, grade, current)
- **Certification** — certificados (imageUrl, credentialUrl, expiración)
- **CertificateFile** — archivos del certificado (path, originalName, mimeType, thumbnail)
- **Project** — proyectos (status enum DRAFT/IN_PROGRESS/COMPLETED/ON_HOLD/CANCELLED/ARCHIVED, demoUrl, githubUrl, gitlabUrl, isFeatured)
- **ProjectImage** — galería de imágenes (isPrimary, thumbnailUrl)
- **Technology** — catálogo compartido de tecnologías
- **ProjectTechnology** — join projects ↔ technologies
- **Skill** — habilidades (category enum, percentage, level)
- **Language** — idiomas (level, percentage)
- **SocialLink** — redes (platform, url, icon, order)
- **Repository** — repositorios (stars, forks, topics[])
- **ContactMessage** — mensajes (isRead)
- **Category / ProjectCategory** — categorías y join
- **Setting** — key/value store (JSON)
- **AuditLog** — auditoría de acciones

---

## 4. Funcionalidades del Panel Público

9 secciones cargadas desde `getPortfolio()` (endpoint combinado) + `getPublicProjects()`:

| Sección | Componente | Funcionalidad |
|---------|-----------|---------------|
| Hero | `hero-section` | Avatar con marco gradient, orbes animados, botones CV + Contáctame, stats |
| Sobre Mí | `about-section` | Biografía, especialidades |
| Experiencia | `experience-section` | Timeline estilo LinkedIn, badge "Actual", logros, tecnologías |
| Educación | `education-section` | Formación académica con nivel |
| Certificaciones | `certifications-section` | Viewer de PDFs, tarjetas de certificados |
| Proyectos | `projects-section` | **Galería con filtros por tecnología**, modal detalle |
| Habilidades | `skills-section` | Barras por categoría |
| Idiomas | `languages-section` | Niveles |
| Contacto | `contact-section` | Formulario con estados loading/error/success |

### Detalles implementados recientemente

- **Modal de proyecto adaptativo**: detecta orientación de la imagen (`object-fit: contain`, `max-height: 70vh`, clase `.portrait`) y muestra links visibles "Demo en vivo", "Repositorio", "Video demostrativo".
- **Skeletons de carga** con shimmer animation.
- **AOS animations** en todas las secciones.
- **Traducción completa al español** de todo el frontend público.
- **Footer de 4 columnas** + navbar sin botón de Admin.
- Botón back-to-top flotante.

---

## 5. Panel de Administración (`/admin`)

Protegido con `authGuard`. Sidebar de 13 módulos:

| Ruta | Módulo | Estado |
|------|--------|--------|
| `/admin/dashboard` | Estadísticas (Chart.js) | ✅ |
| `/admin/profile` | Editar perfil (imagen, banner, CV) | ✅ |
| `/admin/experiences` | CRUD experiencias | ✅ |
| `/admin/education` | CRUD educación | ✅ |
| `/admin/certificates` | CRUD certificados + archivos | ✅ |
| `/admin/projects` | CRUD proyectos + galería | ✅ |
| `/admin/skills` | CRUD habilidades | ✅ |
| `/admin/languages` | CRUD idiomas | ⚠️ localStorage |
| `/admin/repositories` | CRUD repositorios | ⚠️ localStorage |
| `/admin/social-links` | CRUD redes | ⚠️ localStorage |
| `/admin/categories` | CRUD categorías | ⚠️ localStorage |
| `/admin/messages` | Mensajes de contacto | ⚠️ localStorage |
| `/admin/settings` | Ajustes | ⚠️ localStorage |

### Correcciones aplicadas en esta sesión

#### Dashboard
- **Bug de `[object Object]`** en "Project Status": `projectStats` tenía estructura anidada (`total`, `byStatus`, `technologyCounts`) y el template iteraba mal.
- Ahora muestra: total de proyectos, barras por estado con `statusLabel()` (Completado, Borrador, En Progreso, Archivado) y tecnologías como chips con contador.

#### Educación
- **API pública desempaquetada**: el backend devuelve `{ education }`, `{ experiences }`, `{ certifications }`, `{ skills }` y ahora el frontend los unwrappa con `map()`.
- **Bug en editar**: `openEdit()` no incluía el campo `level`.
- **Bug del checkbox "Actual"**: reseteaba `endDate` tras `patchValue`; ahora se maneja el disable/enable antes del `patchValue`.
- **Traducción completa** (TS + HTML): toasts y confirmaciones en español.

#### Certificados
- **Subir imagen y PDF antes de crear**: en el formulario se seleccionan archivos pendientes (`pendingImageFile`, `pendingImagePreview`, `pendingCertFile`, `pendingCertPreview`) y al guardar se crea el certificado y se suben los archivos con `Promise.all`.
- **API corregida**: create/update/getById y uploads desempaquetan respuestas envueltas (`{ certification }`, `{ file }`).
- **Cards corregidas**: usan `issuingOrganization`, `expiryDate`, `imageUrl`; los archivos se muestran con íconos según tipo (🖼 imagen / 📄 PDF) usando `isImage()`/`isPdf()`.
- **Zonas de upload visibles** tanto en "Agregar" como en "Editar", con vista previa y botón para quitar.
- **Eliminación de archivos** corregida (envía solo `file.path`, no la URL completa).
- **Traducción completa al español**.

#### Proyectos
- **Bug de `demoUrl`**: `openEdit()` usaba `(project as any).url` (no existía) → ahora `project.demoUrl`; `save()` enviaba `url:` → ahora `demoUrl:`.

---

## 6. Autenticación y Seguridad

- Registro con **bcrypt (12 rounds)** → crea User + Profile.
- **JWT HS256**: access token (1h) + refresh token (7d), rotación en cada refresh.
- **Rate limiting**: `/api/auth/` 10 req/15 min; resto `RATE_LIMIT_MAX` / ventana configurable.
- **Helmet** con CSP configurada.
- **Soft delete** en entidades principales.
- **Refresh token con try-catch** (corregido error 500).
- **Interceptor de errores** con retry de 401 vía refresh.

### Usuario semilla
```
Email: admin@portfolio.com
Pass:  Admin123!
```

---

## 7. Despliegue

### Flujo (`deploy.sh` — corre en el servidor Linux, no en Windows)
1. `npm ci`
2. `ng build --configuration production` (`baseHref="/portfolio/"`)
3. Copia `dist/` a `/var/www/portfolio`
4. `docker compose -f docker-compose.prod.yml up -d`
5. Health check

### Configuración de producción
- **Sin contenedor frontend**: la SPA se sirve estáticamente desde Nginx.
- Backend en contenedor `portfolio-api` con `network_mode: host` (puerto 3000).
- Volumen `backend_uploads:/app/uploads` para persistir archivos subidos.
- `environment.prod.ts`: `apiUrl: '/portfolio/api'`, `uploadUrl: '/portfolio/uploads'`.
- Nginx: `/portfolio/api/*` → `127.0.0.1:3000`, `/portfolio/uploads/*` → backend.

---

## 8. Problemas Conocidos / Pendientes

| # | Problema | Severidad |
|---|----------|-----------|
| 1 | Languages, SocialLinks, Repositories, Categories, ContactMessages, Settings usan **localStorage** en vez de API (no persisten entre dispositivos) | Media |
| 2 | `prisma.uploadedFile` referenciado en UploadController pero **no existe en el schema** (crashearía si se invoca) | Alta |
| 3 | GitHub/GitLab sync son **stubs** | Baja |
| 4 | Password de DB **hardcodeada** en docker-compose.prod.yml (`086411421`) | Alta |
| 5 | CORS hardcodeado | Media |
| 6 | Email **no implementado** (SMTP configurado en nodemailer) | Baja |
| 7 | Sin retry automático tras fallo de refresh token | Baja |
| 8 | Warnings de presupuesto CSS (3 SCSS exceden 8.19 kB) | Baja |

---

## 9. Próximos Pasos Sugeridos

1. **Deploy a producción** (último paso pendiente de la sesión) para probar los cambios de certificados, educación y dashboard en el servidor real.
2. Migrar los 6 módulos de localStorage → API para persistencia real.
3. Corregir `UploadController` (modelo `UploadedFile`).
4. Mover secretos a variables de entorno en el servidor.
5. Reducir presupuesto CSS de los componentes señalados.

---

## 10. Estado del Build

- ✅ Build de producción exitoso tras cada lote de cambios.
- Chunks principales ~870 kB (initial total), secciones públicas y admin con **lazy loading**.
- Warnings menores de presupuesto CSS (no bloqueantes).
