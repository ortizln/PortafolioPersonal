# Portafolio Personal — DevBlackSheep

Sistema de portafolio profesional administrable. Frontend Angular 18 + Backend Node/Express/Prisma + PostgreSQL.

```
Usuario → Nginx (192.168.100.125) → /portfolio/     → Angular SPA (standalone)
                                   → /portfolio/api/* → Docker: Backend (Express :3000)
                                   → /portfolio/uploads → Archivos estáticos
```

---

## Stack

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | Angular 18.2 standalone, Bootstrap 5.3, Angular Material, Chart.js, AOS, RxJS |
| **Backend** | Node 20 + Express 4.21, Prisma 5.22, JWT (HS256), bcryptjs, Multer + Sharp, Helmet |
| **BD** | PostgreSQL 16 |
| **Deploy** | Docker Compose, Nginx, servidor Ubuntu |

---

## Frontend — 43 Componentes

### Layouts
- **PublicLayout** — navbar + footer, tema oscuro/claro, menú responsive
- **AdminLayout** — sidebar colapsable con 13 secciones, topbar, tema
- **AuthLayout** — mínimo, solo brand + formulario

### Rutas
```
/                    → PortfolioComponent (vista pública principal)
/about               → AboutPageComponent
/experience          → ExperiencePageComponent
/projects            → ProjectsPageComponent
/skills              → SkillsPageComponent
/contact             → ContactPageComponent
/portfolio           → redirige a /

/admin               → AdminLayout (protegido por authGuard)
/admin/dashboard     → DashboardComponent
/admin/profile       → ProfileEditComponent
/admin/experiences   → ExperienceListComponent
/admin/education     → EducationListComponent
/admin/certificates  → CertificateListComponent
/admin/projects      → ProjectListComponent
/admin/skills        → SkillListComponent
/admin/languages     → LanguageListComponent
/admin/social-links  → SocialLinksComponent
/admin/repositories  → RepositoryListComponent
/admin/categories    → CategoryListComponent
/admin/messages      → ContactMessagesComponent
/admin/settings      → SettingsComponent

/auth/login          → LoginComponent
/auth/register       → RegisterComponent
```

### Secciones públicas (PortfolioComponent)
Hero, Sobre Mí, Experiencia (timeline), Educación, Certificados (visor PDF), Proyectos (galería con filtros), Habilidades (barras por categoría), Idiomas, Contacto (formulario).

### Core
- **ApiService** — 20+ endpoints (CRUD + públicos + upload + stats)
- **AuthService** — JWT en localStorage, `currentUser$` BehaviorSubject
- **AuthInterceptor** — adjunta Bearer token
- **ErrorInterceptor** — refresh automático en 401, redirect a login si falla
- **AuthGuard** — verifica token expiry, refresh si expiró
- **ConfirmModal** — diálogo de confirmación dinámico

---

## Backend — 18 Controladores

### Estructura
```
src/
├── app.js                     # Entry point (middleware stack + routes)
├── auth/jwt.js                # HS256, access 1h, refresh 7d
├── config/database.js         # PrismaClient singleton
├── controllers/               # 18 controladores
├── middlewares/auth.js         # authenticate + authorize
├── middlewares/errorHandler.js # AppError + err.code mapping
├── routes/                    # 18 route files
├── helpers/upload.js          # Multer disk storage + UUID
├── validations/index.js       # express-validator rules
└── swagger/swagger.js         # OpenAPI 3.0
```

### Middleware stack (orden)
Helmet → Compression → CORS → JSON (1mb) → Morgan → Rate limiting → Static `/uploads` → Swagger `/api-docs` → Routes → Health `/api/health` → Error handler.

### Modelos BD (18 tablas)
User, Profile, Experience, Education, Certification, CertificateFile, Project, ProjectImage, Technology, ProjectTechnology, Skill, Language, SocialLink, Repository, ContactMessage, Category, ProjectCategory, Setting, AuditLog.

### Auth flow
Register → hash bcrypt (12 rounds) → create user+profile → tokens (HS256). Login → verify → tokens. Refresh → verify refresh token → rotate ambos. Logout → null refresh token en DB. Soft delete en entidades principales.

### Seed
Admin: `admin@portfolio.com` / `Admin123!` + 15 technologies + 10 skills + 3 languages + 3 social links.

---

## Estado por Módulo

| Módulo | Frontend | Backend | Estado |
|--------|----------|---------|--------|
| Auth | Login/Register/Logout/Refresh | JWT HS256 + refresh rotation | **Completo** |
| Profile | Edit, photo/banner/CV upload | CRUD + Multer/Sharp | **Completo** |
| Experiences | CRUD lista con drag | CRUD + soft delete | **Completo** |
| Education | CRUD lista | CRUD + soft delete | **Completo** |
| Certificates | CRUD + upload file/image | CRUD + file/image upload | **Completo** |
| Projects | CRUD + galería imágenes | CRUD + image management | **Completo** |
| Skills | CRUD con orden | CRUD + soft delete | **Completo** |
| Languages | CRUD (localStorage) | CRUD | **No conecta al API** |
| Social Links | CRUD (localStorage) | CRUD | **No conecta al API** |
| Repositories | CRUD + sync (stubs) | CRUD + sync (stubs) | **No conecta al API** |
| Categories | CRUD (localStorage) | CRUD + slugify | **No conecta al API** |
| Contact Messages | Bandeja (localStorage) | CRUD + markAsRead | **No conecta al API** |
| Settings | Editor (localStorage) | CRUD key/value | **No conecta al API** |
| Dashboard | Charts + stats | Stats controller | **Completo** |
| Público | 9 secciones | Portfolio combined endpoint | **Completo** |

---

## Problemas Conocidos

| # | Problema | Impacto |
|---|----------|---------|
| 1 | Languages, SocialLinks, Repositories, Categories, ContactMessages, Settings usan localStorage en vez del API | Datos no persisten en backend |
| 2 | `prisma.uploadedFile` referenciado en UploadController pero no existe en schema | Crash si se invoca |
| 3 | GitHub/GitLab sync son stubs sin implementación real | No sincroniza repos |
| 4 | `docker-compose.prod.yml` tiene DB password hardcodeada | Riesgo de seguridad |
| 5 | CORS hardcodeado a `http://192.168.100.125` | No portable |
| 6 | Sin envío de emails (SMTP configurado pero no implementado) | No hay notificaciones ni recovery |
| 7 | Sin reintento automático de requests tras refresh token | Pérdida de datos si token expira |

---

## Deploy

```bash
# En el servidor Linux (192.168.100.125)
cd ~/PortafolioPersonal
./deploy.sh
```

El script: `npm ci` → `ng build --configuration production` → copia a `/var/www/portfolio` → `docker compose -f docker-compose.prod.yml up -d` → health check.

### Nginx (control-servidor)
```
location /portfolio/ {
    root /var/www;
    try_files $uri $uri/ /portfolio/index.html;
}

location /portfolio/api/ {
    proxy_pass http://127.0.0.1:3000/api/;
}

location /portfolio/uploads/ {
    proxy_pass http://127.0.0.1:3000/uploads/;
}
```

No usar `alias`, no usar regex location blocks para assets (interceptan JS). Sin symlink en `/etc/nginx/sites-enabled/portfolio`.

---

## Cambios Recientes

- `fileReplacements` en angular.json → build production usa `environment.prod.ts`
- Rutas: `''` carga portfolio directamente, `/portfolio` redirige a `''` (evita `/portfolio/portfolio`)
- Project API: unwrap `{ project }` response, UUID strings, image URL prefix
- Refresh token 500: try-catch en JWT verify
- Disabled attribute warnings: `valueChanges` en vez de `[disabled]` en template
- Settings: try-catch para localStorage corrupto
- baseHref `/portfolio/` + environment URLs `/portfolio/api` y `/portfolio/uploads`
