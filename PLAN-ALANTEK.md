# PLAN DE TRANSFORMACIÓN — PORTAFOLIO PERSONAL → SITIO CORPORATIVO ALANTEK
> Documento de trabajo para evolucionar la aplicación actual DevBlackSheep hacia una plataforma corporativa, multiusuario y administrable para la marca **ALANTEK**.

---

## 1. Objetivo general

Transformar el portafolio personal actual en el **sitio web corporativo de ALANTEK**, reutilizando la arquitectura Angular 18 + Node/Express + Prisma + PostgreSQL, pero reemplazando el enfoque de "perfil personal" por una estructura empresarial capaz de administrar:

- identidad y contenido corporativo;
- servicios y líneas de negocio;
- múltiples miembros del equipo;
- perfiles profesionales individuales;
- proyectos y casos de éxito;
- tecnologías y competencias;
- clientes y testimonios;
- publicaciones/noticias;
- formularios de contacto y oportunidades comerciales;
- usuarios administrativos con roles y permisos;
- estadísticas, auditoría y configuración global.

---

## 2. Estado actual que se reutiliza

La aplicación existente ya dispone de una base sólida:

- Angular 18 standalone con lazy loading.
- Node.js 20 + Express.
- PostgreSQL 16 + Prisma ORM.
- JWT con access/refresh token.
- CRUD de proyectos, perfil, experiencia, educación, certificaciones y habilidades.
- Galerías de proyectos.
- Catálogo de tecnologías.
- Mensajes de contacto.
- Dashboard con Chart.js.
- Subida de imágenes/PDF.
- Swagger.
- Auditoría.
- Nginx + Docker Compose.
- Tema claro/oscuro y diseño responsive.

La estrategia será **evolucionar**, no reconstruir desde cero.

---

# 3. Cambio conceptual principal

## Antes

```text
PORTAFOLIO PERSONAL
└── Un perfil
    ├── Experiencia
    ├── Educación
    ├── Certificaciones
    ├── Skills
    ├── Proyectos
    └── Contacto
```

## Después

```text
ALANTEK
├── Empresa
│   ├── Identidad corporativa
│   ├── Nosotros
│   ├── Misión / Visión / Valores
│   ├── Servicios
│   ├── Tecnologías
│   └── Contacto
│
├── Equipo
│   ├── Miembro 1
│   │   ├── Perfil
│   │   ├── Cargo
│   │   ├── Biografía
│   │   ├── Experiencia
│   │   ├── Educación
│   │   ├── Certificaciones
│   │   ├── Habilidades
│   │   ├── Redes
│   │   └── Proyectos
│   └── Miembro N
│
├── Portafolio
│   ├── Proyectos
│   ├── Casos de éxito
│   ├── Categorías
│   ├── Tecnologías
│   └── Clientes
│
└── Administración
    ├── Usuarios
    ├── Roles
    ├── Permisos
    ├── Contenido
    ├── Multimedia
    ├── Mensajes
    ├── Estadísticas
    └── Auditoría
```

---

# 4. Arquitectura funcional propuesta

## 4.1 Sitio público

Crear las siguientes rutas:

```text
/
/nosotros
/servicios
/servicios/:slug
/proyectos
/proyectos/:slug
/equipo
/equipo/:slug
/clientes
/blog
/blog/:slug
/contacto
```

### Home corporativo

La página principal deberá incluir:

1. Hero de ALANTEK.
2. Propuesta de valor.
3. Servicios principales.
4. Proyectos destacados.
5. Tecnologías utilizadas.
6. Indicadores corporativos.
7. Equipo destacado.
8. Metodología de trabajo.
9. Clientes o sectores atendidos.
10. Testimonios.
11. CTA para solicitar reunión/cotización.
12. Contacto.
13. Footer corporativo.

### Hero

Reemplazar el avatar personal por:

- logotipo ALANTEK;
- claim corporativo;
- descripción breve;
- CTA `Conoce nuestros proyectos`;
- CTA `Solicita una propuesta`;
- imagen/banner administrable.

---

# 5. Módulo Empresa

Crear entidad `Company`.

Campos sugeridos:

```text
id
name
legalName
slug
slogan
shortDescription
description
mission
vision
history
email
phone
whatsapp
website
address
city
country
logoUrl
logoDarkUrl
faviconUrl
heroImageUrl
primaryColor
secondaryColor
accentColor
foundedYear
isActive
createdAt
updatedAt
```

Crear módulo administrativo:

```text
/admin/company
```

Permitir administrar:

- información general;
- misión;
- visión;
- valores;
- historia;
- logotipos;
- favicon;
- colores;
- datos de contacto;
- redes sociales;
- SEO corporativo.

---

# 6. Módulo Servicios

Crear modelos:

```text
Service
ServiceFeature
ServiceTechnology
```

### Service

```text
id
name
slug
shortDescription
description
icon
coverImage
status
order
isFeatured
seoTitle
seoDescription
createdAt
updatedAt
deletedAt
```

Ejemplos iniciales de categorías, totalmente administrables:

- Desarrollo de software.
- Sistemas empresariales.
- Aplicaciones móviles.
- Integraciones y APIs.
- Facturación electrónica.
- Automatización de procesos.
- Infraestructura y despliegue.
- Consultoría tecnológica.

Crear:

```text
/admin/services
```

CRUD completo + orden + publicación + destacados.

---

# 7. Módulo Equipo

El modelo actual `Profile` debe evolucionar para permitir múltiples perfiles.

Crear:

```text
TeamMember
TeamMemberSkill
TeamMemberTechnology
TeamMemberSocialLink
```

### TeamMember

```text
id
userId?
firstName
lastName
slug
jobTitle
department
shortBio
biography
profileImage
coverImage
emailPublic
phonePublic
location
yearsExperience
displayOrder
isPublic
isFeatured
status
createdAt
updatedAt
deletedAt
```

## Perfil público

Ruta:

```text
/equipo/:slug
```

Debe mostrar:

- fotografía;
- cargo;
- biografía;
- especialidades;
- tecnologías;
- experiencia;
- educación;
- certificaciones;
- proyectos en los que participó;
- redes profesionales.

### Importante

Un miembro del equipo **no necesariamente debe tener acceso al panel administrativo**.

`TeamMember` y `User` serán entidades diferentes, con relación opcional.

---

# 8. Adaptación de experiencia, educación y certificaciones

Actualmente estas entidades están asociadas conceptualmente a un único perfil.

Modificar:

```text
Experience
Education
Certification
Skill
Language
SocialLink
```

para que soporten:

```text
teamMemberId
```

Relación:

```text
TeamMember
 ├── Experiences
 ├── Education
 ├── Certifications
 ├── Skills
 ├── Languages
 └── SocialLinks
```

Esto permitirá construir perfiles profesionales completos para cada integrante.

---

# 9. Evolución del módulo Proyectos

Mantener el módulo actual, pero ampliarlo.

Agregar:

```text
slug
clientId?
serviceId?
summary
challenge
solution
results
startDate
endDate
projectType
visibility
seoTitle
seoDescription
```

Crear relaciones:

```text
ProjectMember
ProjectService
ProjectTechnology
ProjectCategory
ProjectImage
```

## ProjectMember

```text
id
projectId
teamMemberId
role
description
isLead
```

Así se podrá mostrar:

> Equipo que participó en el proyecto.

## Página de proyecto

Ruta:

```text
/proyectos/:slug
```

Secciones:

- portada;
- resumen;
- problema;
- solución;
- arquitectura;
- tecnologías;
- galería;
- resultados;
- miembros participantes;
- enlaces demo/repositorio/video;
- proyectos relacionados.

---

# 10. Casos de éxito

Puede implementarse como extensión de `Project`:

```text
isCaseStudy
challenge
solution
results
metrics JSON
```

o como modelo separado `CaseStudy`.

Recomendación inicial: **extender Project**, evitando duplicar información.

---

# 11. Clientes

Crear:

```text
Client
```

Campos:

```text
id
name
slug
logoUrl
website
industry
description
isPublic
isFeatured
createdAt
updatedAt
```

Relacionar:

```text
Client 1 ---- N Project
```

Crear:

```text
/admin/clients
```

---

# 12. Testimonios

Crear:

```text
Testimonial
```

Campos:

```text
id
clientId?
authorName
authorPosition
company
content
photoUrl
rating?
isPublished
isFeatured
order
```

Administración:

```text
/admin/testimonials
```

---

# 13. Blog / Noticias

Crear:

```text
Post
PostCategory
PostTag
```

Campos principales:

```text
title
slug
excerpt
content
coverImage
authorId
status
publishedAt
seoTitle
seoDescription
```

Estados:

```text
DRAFT
REVIEW
PUBLISHED
ARCHIVED
```

Ruta pública:

```text
/blog
/blog/:slug
```

Administración:

```text
/admin/posts
```

---

# 14. Contacto y oportunidades comerciales

Evolucionar `ContactMessage`.

Agregar:

```text
company
phone
serviceId
budgetRange
projectType
status
assignedTo
notes
source
```

Estados:

```text
NEW
CONTACTED
QUALIFIED
PROPOSAL
WON
LOST
SPAM
```

El panel deberá permitir utilizar los mensajes como un CRM comercial básico.

Crear dashboard:

```text
/admin/leads
```

---

# 15. Usuarios, roles y permisos

Actualmente existen:

```text
ADMIN
USER
```

Reemplazar por RBAC.

Crear:

```text
Role
Permission
UserRole
RolePermission
```

Roles iniciales:

```text
SUPER_ADMIN
ADMIN
CONTENT_MANAGER
PROJECT_MANAGER
TEAM_MEMBER
VIEWER
```

Ejemplos de permisos:

```text
company.read
company.update

team.read
team.create
team.update
team.delete

projects.read
projects.create
projects.update
projects.delete
projects.publish

services.manage

posts.manage
posts.publish

messages.read
messages.update

users.manage
roles.manage

settings.manage
audit.read
```

Crear guard de permisos en backend y frontend.

---

# 16. Panel administrativo ALANTEK

Reorganizar sidebar:

```text
Dashboard

EMPRESA
 ├── Información corporativa
 ├── Servicios
 ├── Clientes
 └── Testimonios

PORTAFOLIO
 ├── Proyectos
 ├── Categorías
 └── Tecnologías

EQUIPO
 ├── Miembros
 ├── Experiencia
 ├── Educación
 ├── Certificaciones
 └── Habilidades

CONTENIDO
 ├── Blog
 ├── Multimedia
 └── SEO

COMERCIAL
 ├── Contactos / Leads
 └── Solicitudes

SISTEMA
 ├── Usuarios
 ├── Roles y permisos
 ├── Configuración
 ├── Auditoría
 └── Logs
```

---

# 17. Dashboard empresarial

Crear KPIs:

```text
Proyectos totales
Proyectos publicados
Proyectos por categoría
Proyectos por tecnología
Miembros del equipo
Servicios activos
Clientes
Mensajes nuevos
Leads por estado
Visitas
Páginas más visitadas
Proyectos más consultados
```

Charts sugeridos:

- proyectos por estado;
- proyectos por tecnología;
- leads por estado;
- contactos por mes;
- contenido publicado;
- actividad administrativa reciente.

---

# 18. Biblioteca multimedia

Corregir primero el problema actual:

```text
prisma.uploadedFile
```

Actualmente se referencia un modelo que no existe.

Crear modelo:

```text
MediaFile
```

Campos:

```text
id
fileName
originalName
path
url
mimeType
size
width
height
altText
folder
uploadedBy
createdAt
deletedAt
```

Crear:

```text
/admin/media
```

Funciones:

- subir;
- buscar;
- filtrar;
- previsualizar;
- reutilizar;
- editar texto alternativo;
- eliminar;
- copiar URL.

---

# 19. Configuración y contenido dinámico

Eliminar dependencia de `localStorage`.

Migrar a API:

- Languages.
- SocialLinks.
- Repositories.
- Categories.
- ContactMessages.
- Settings.

Todo contenido visible debe persistir en PostgreSQL.

---

# 20. Seguridad obligatoria antes de publicar ALANTEK

## Prioridad crítica

Eliminar inmediatamente:

```text
password de base de datos hardcodeado
```

Mover a:

```text
.env
```

Configurar:

```text
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
CORS_ORIGIN
SMTP_HOST
SMTP_USER
SMTP_PASS
UPLOAD_PATH
```

Además:

- invalidar credenciales expuestas;
- cambiar usuario semilla;
- impedir registro público de administradores;
- implementar recuperación de contraseña;
- políticas de contraseña;
- logs de login;
- bloqueo temporal por intentos;
- validación MIME;
- límites de archivos;
- sanitización de inputs;
- autorización por permiso;
- revisar CSP;
- configurar CORS desde entorno.

---

# 21. Correo electrónico

Implementar Nodemailer/SMTP realmente.

Casos:

```text
Formulario de contacto
Solicitud de cotización
Notificación de nuevo lead
Recuperación de contraseña
Invitación de usuario
Confirmación de recepción
```

Crear templates HTML corporativos ALANTEK.

---

# 22. SEO

Agregar:

```text
SeoMetadata
```

o campos SEO por entidad.

Configurar:

- title dinámico;
- meta description;
- Open Graph;
- Twitter cards;
- canonical URL;
- sitemap.xml;
- robots.txt;
- JSON-LD Organization;
- JSON-LD Person para miembros;
- JSON-LD Article;
- JSON-LD BreadcrumbList.

---

# 23. Identidad visual ALANTEK

Crear sistema de diseño.

Variables:

```scss
--alantek-primary
--alantek-secondary
--alantek-accent
--alantek-background
--alantek-surface
--alantek-text
```

Definir:

- tipografía corporativa;
- botones;
- cards;
- badges;
- iconografía;
- espaciados;
- sombras;
- radios;
- estados;
- light/dark theme.

No dejar estilos heredados que sigan identificando el sitio como DevBlackSheep.

---

# 24. Migración de rutas

Cambiar:

```text
/portfolio/
```

por la ruta o dominio final de ALANTEK.

Ideal:

```text
https://alantek.[dominio]/
```

Backend:

```text
/api/
```

Uploads:

```text
/uploads/
```

No realizar este cambio hasta disponer del dominio definitivo.

---

# 25. API propuesta

Nuevos endpoints:

```text
/api/company
/api/services
/api/team
/api/team/:id/experiences
/api/team/:id/education
/api/team/:id/certifications
/api/team/:id/skills
/api/clients
/api/testimonials
/api/posts
/api/leads
/api/media
/api/roles
/api/permissions
```

Mantener/adaptar:

```text
/api/auth
/api/users
/api/projects
/api/categories
/api/technologies
/api/settings
/api/stats
/api/public
```

---

# 26. Refactor del endpoint público

No devolver todo el sitio en una única respuesta pesada.

Separar:

```text
GET /api/public/home
GET /api/public/company
GET /api/public/services
GET /api/public/projects
GET /api/public/projects/:slug
GET /api/public/team
GET /api/public/team/:slug
GET /api/public/clients
GET /api/public/testimonials
GET /api/public/posts
GET /api/public/posts/:slug
```

Aplicar caché a contenido público.

---

# 27. Rendimiento

Aplicar:

- imágenes WebP/AVIF;
- thumbnails;
- lazy loading;
- responsive images;
- compresión;
- caché;
- paginación;
- búsqueda server-side;
- índices PostgreSQL;
- evitar N+1 en Prisma;
- CDN en fase posterior;
- optimizar SCSS que supera budgets.

---

# 28. Accesibilidad

Implementar mínimo:

- WCAG AA como objetivo;
- navegación por teclado;
- contraste;
- focus visible;
- labels;
- ARIA cuando corresponda;
- alt text administrable;
- formularios accesibles;
- jerarquía correcta de encabezados.

---

# 29. Auditoría

Extender `AuditLog`.

Registrar:

```text
LOGIN
LOGIN_FAILED
CREATE
UPDATE
DELETE
RESTORE
PUBLISH
UNPUBLISH
UPLOAD
PASSWORD_CHANGE
ROLE_CHANGE
```

Datos:

```text
userId
action
entity
entityId
ip
userAgent
metadata
createdAt
```

---

# 30. Estrategia de migración de base de datos

No eliminar inicialmente las tablas actuales.

Fases:

1. Backup completo.
2. Crear nuevas entidades.
3. Crear `TeamMember`.
4. Migrar el `Profile` actual al primer miembro.
5. Relacionar experiencia/educación/certificaciones.
6. Adaptar proyectos.
7. Crear empresa ALANTEK.
8. Validar datos.
9. Cambiar frontend.
10. Retirar estructuras antiguas solo después de validar producción.

---

# 31. Fases de desarrollo

## FASE 0 — Respaldo y estabilización

- [ ] Backup PostgreSQL.
- [ ] Backup uploads.
- [x] Crear rama `feature/alantek-corporate`.
- [x] Documentar variables actuales (`backend/.env.example` + `.env.prod.example`).
- [x] Eliminar secretos hardcodeados (`docker-compose.prod.yml`, `seed.js`, registro público fuerza `role: USER`).
- [ ] Cambiar credenciales comprometidas (DB y JWT reales en el servidor).
- [x] Corregir `UploadController` (nuevo modelo `MediaFile` + borrado físico correcto).
- [x] Migrar localStorage a API (languages, social links, repositories, categories, contact, settings).

**Resultado:** base actual estable y segura.

### Backup (ejecutar en el servidor `192.168.100.215`)

Método recomendado — script `backup.sh` (raíz del repo), que respalda PostgreSQL, uploads y `.env`:

```bash
cd /ruta/al/repo
chmod +x backup.sh
./backup.sh
```

Crea en `/var/backups/portfolio/<fecha>/`:
- `database.sql.gz` — dump de `portfolio_db` (usa `pg_dump` del sistema, o imagen docker `postgres:16-alpine` si no está instalado).
- `uploads_<fecha>.tar.gz` — volumen `backend_uploads`.
- `.env` — variables de entorno (secreto, imprescindible para restaurar JWT).

Conserva los últimos 7 backups (configurable con `RETENTION_DAYS`) y requiere que `DATABASE_URL` del `.env` use el formato `postgresql://usuario:clave@host:puerto/bd`.

Referencia manual si se prefiere:

```bash
# Dump DB
PGPASSWORD='CLAVE' pg_dump -h localhost -p 5432 -U postgres portfolio_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Uploads
docker run --rm -v backend_uploads:/data:ro -v "$PWD":/backup alpine \
  tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .
```

Restaurar cuando sea necesario:

```bash
gunzip -c database.sql.gz | PGPASSWORD='CLAVE' psql -h localhost -U postgres portfolio_db
tar xzf uploads_*.tar.gz   # en el volumen backend_uploads
```

> Guardar los archivos de backup fuera del servidor (otro disco / nube). Los volúmenes Docker se destruyen con `docker compose down -v`, así que el backup debe ser externo. La contraseña de la BD no debe contener `:` ni `@` (el parser del script no la soporta).

---

## FASE 1 — Núcleo corporativo

- [x] Crear `Company`.
- [x] Crear `Service`.
- [x] Crear `Client`.
- [x] Crear `Testimonial`.
- [ ] Configuración de marca.
- [x] Nuevos endpoints.
- [x] CRUD administrativos.

**Resultado:** ALANTEK puede administrar información empresarial.

---

## FASE 2 — Equipo multi-perfil

- [x] Crear `TeamMember`.
- [x] Adaptar Experience.
- [x] Adaptar Education.
- [x] Adaptar Certification.
- [x] Adaptar Skill.
- [x] Adaptar Language.
- [x] Adaptar SocialLink.
- [x] Crear `/equipo`.
- [x] Crear `/equipo/:slug`.
- [x] CRUD de miembros.

**Resultado:** múltiples integrantes con perfiles completos.

---

## FASE 3 — Portafolio empresarial

- [x] Ampliar `Project` (slug, clientId, serviceId, projectType, visibility, seo, case study).
- [x] Crear `ProjectMember`.
- [x] Relacionar cliente.
- [x] Relacionar servicio.
- [x] Crear case studies (challenge/solution/results/metrics + `isCaseStudy`).
- [x] Crear página individual de proyecto (`/proyectos/:slug`).
- [x] Búsqueda y filtros (search/category/technology/status en API pública).
- [x] Proyectos relacionados.

**Resultado:** portafolio corporativo escalable.

---

## FASE 4 — Nuevo frontend ALANTEK

- [x] Rediseñar navbar (logo empresa, nav corporativo, CTA Cotizar).
- [x] Rediseñar home (hero empresa, servicios destacados, proyectos, clientes, testimonios, CTA).
- [x] Crear Nosotros (`/nosotros`).
- [x] Crear Servicios (`/servicios`).
- [x] Crear Equipo (`/equipo` y `/equipo/:slug`).
- [x] Crear Clientes (`/clientes`).
- [x] Crear Portafolio (`/portafolio` con búsqueda y filtros + `/proyectos/:slug`).
- [x] Crear Contacto (`/contacto`).
- [x] Aplicar identidad visual (variables `--alantek-*` + colores dinámicos desde Company).
- [x] Responsive.
- [x] Accesibilidad (skip-link, aria, focus, roles).
- [x] Animaciones moderadas (AOS).

**Resultado:** sitio público completamente corporativo.

---

## FASE 5 — Administración avanzada

- [x] RBAC.
- [x] Roles.
- [x] Permisos.
- [x] Media library.
- [x] Leads.
- [x] Dashboard empresarial.
- [x] Auditoría ampliada.
- [x] Recuperación de contraseña.
- [x] Notificaciones.

**Resultado:** CMS corporativo administrable por varios usuarios.
*(Pendiente de aplicar: `npx prisma migrate deploy` + seed en el servidor / Postgres local; build frontend OK.)*

---

## FASE 6 — Contenido y posicionamiento

- [x] Blog (CRUD posts/categorías/tags, estados, soft delete, panel admin `/admin/posts`, páginas públicas `/blog` y `/blog/:slug`).
- [x] SEO dinámico (campo SEO por post + metadatos genéricos `SeoMetadata` + `SeoService` frontend).
- [x] Sitemap (`/sitemap.xml` + `/api/public/sitemap`, incluye proyectos, posts, equipo y páginas estáticas).
- [x] Robots (`/robots.txt` + `/api/public/robots`).
- [x] Open Graph (meta OG/Twitter por página vía `SeoService`).
- [x] Structured Data (JSON-LD: Organization, Article, BreadcrumbList, WebSite).
- [ ] Analytics (pendiente de decidir plataforma y conectar el script vía Setting).
- [ ] Consentimiento/cookies si corresponde (pendiente).

**Resultado:** plataforma preparada para posicionamiento y marketing.
*(Pendiente de aplicar: `npx prisma migrate deploy` (migración `20260814120000_posts_seo`) en Postgres local/servidor; build frontend OK.)*

---

## FASE 7 — QA y producción

- [x] Unit tests (backend Vitest: jwt, memberScope — `npm test` en `backend/`).
- [x] Integration/smoke tests (supertest sobre la app real con BD: rutas públicas, blog, sitemap, robots, 401 en protegidas; se saltan si la BD no está disponible).
- [ ] E2E (pendiente: e.g. Playwright/Cypress).
- [ ] Pruebas de permisos (manual, por rol).
- [ ] Pruebas de uploads (manual).
- [ ] Lighthouse (manual sobre producción).
- [x] Seguridad base (helmet con CSP, rate limiting por API y por auth, CORS restringido, headers en nginx).
- [x] Backup/restore (`backup.sh` con pg_dump + uploads, retención 7 días).
- [x] Build production (frontend `npm run build` verificado; migraciones aplicadas en BD local).
- [ ] Deploy staging (manual en servidor: `./deploy.sh` + `./migrate-corporate.sh`).
- [ ] UAT.
- [ ] Deploy producción.
- [ ] Monitoreo.

**Notas FASE 7:** nginx actualizado (`server_name 192.168.100.215` + proxy de `/sitemap.xml` y `/robots.txt` al backend). Correcciones de bugs detectados por los smoke: `Company` no tiene `deletedAt` (ahora filtra `isActive`) y `Project` no tiene `isPublished` (filtra `visibility: 'PUBLIC'`).

---

# 32. Orden recomendado de implementación

```text
1. Seguridad y deuda técnica
2. Persistencia real
3. Company
4. TeamMember
5. Services
6. Projects
7. Clients
8. Public frontend
9. RBAC
10. Media
11. Leads
12. Dashboard
13. Blog
14. SEO
15. Testing
16. Producción
```

---

# 33. Skills de desarrollo recomendados

## Backend

- Node.js / Express architecture
- REST API design
- Prisma ORM
- PostgreSQL
- RBAC
- JWT security
- File uploads
- Nodemailer
- OpenAPI / Swagger
- Validation
- Audit logging
- API testing

## Frontend

- Angular 18 standalone
- Angular Router
- Reactive Forms
- RxJS
- Route guards
- HTTP interceptors
- Angular Material
- Bootstrap
- Responsive design
- Accessibility
- SEO / SSR evaluation
- Lazy loading
- State management

## DevOps

- Docker
- Docker Compose
- Nginx
- Ubuntu
- SSL/TLS
- Environment secrets
- PostgreSQL backup
- CI/CD
- Monitoring

## QA

- Jest
- Supertest
- Angular unit testing
- Playwright/Cypress
- API integration tests
- Lighthouse
- OWASP review

---

# 34. Prompts de trabajo por fase

## Prompt 1 — Auditoría inicial

```text
Analiza el proyecto actual DevBlackSheep antes de modificarlo.
No elimines funcionalidades existentes.
Revisa Prisma schema, rutas Express, guards, services Angular,
localStorage, uploads, variables de entorno y seguridad.
Genera un listado de deuda técnica y un plan de migración hacia ALANTEK.
No escribas código hasta terminar el diagnóstico.
```

## Prompt 2 — Modelo corporativo

```text
Implementa el núcleo corporativo ALANTEK.
Crea los modelos Company, Service, Client y Testimonial en Prisma.
Genera migraciones, validaciones, services, controllers, routes,
Swagger y CRUD Angular.
Mantén soft delete y AuditLog.
No rompas los endpoints actuales.
```

## Prompt 3 — Equipo

```text
Transforma el modelo de perfil único en un sistema multi-perfil.
Crea TeamMember y relaciona Experience, Education, Certification,
Skill, Language y SocialLink mediante teamMemberId.
Migra el Profile actual al primer TeamMember.
Crea CRUD administrativo y páginas públicas /equipo y /equipo/:slug.
```

## Prompt 4 — Proyectos

```text
Evoluciona Project para un portafolio empresarial.
Agrega slug, cliente, servicio, challenge, solution, results,
SEO y miembros participantes.
Crea ProjectMember.
Mantén ProjectImage, ProjectTechnology y ProjectCategory.
Crea una página pública completa de caso de proyecto.
```

## Prompt 5 — RBAC

```text
Reemplaza el sistema ADMIN/USER por RBAC.
Implementa Role, Permission, UserRole y RolePermission.
Crea middleware backend requirePermission().
Crea permissionGuard/directive en Angular.
Protege rutas, botones y acciones CRUD.
SUPER_ADMIN debe conservar acceso total.
```

## Prompt 6 — Rediseño

```text
Rediseña el frontend público para la marca ALANTEK.
Elimina la apariencia de portafolio personal.
Crea una home tecnológica corporativa con Hero, servicios,
proyectos destacados, tecnologías, equipo, metodología,
clientes, testimonios y CTA.
Todo el contenido debe provenir de la API.
Mantén responsive, dark/light mode y accesibilidad.
```

## Prompt 7 — QA

```text
Realiza una auditoría final del proyecto ALANTEK.
Ejecuta pruebas de API, permisos, autenticación, uploads,
formularios, responsive, accesibilidad, SEO y producción.
No marques una fase como terminada mientras existan errores
críticos, secretos expuestos o módulos dependientes de localStorage.
```

---

# 35. Criterios de aceptación generales

- [ ] El sitio ya no depende de un único perfil.
- [ ] ALANTEK tiene identidad corporativa administrable.
- [ ] Se pueden registrar N miembros.
- [ ] Cada miembro puede tener perfil profesional completo.
- [ ] Un proyecto puede tener varios miembros.
- [ ] Un miembro puede participar en varios proyectos.
- [ ] Se pueden administrar servicios.
- [ ] Se pueden administrar clientes.
- [ ] Todos los módulos persistentes utilizan PostgreSQL.
- [ ] No existen secretos hardcodeados.
- [ ] Los usuarios tienen permisos granulares.
- [ ] El contenido público tiene slugs.
- [ ] Los proyectos tienen páginas individuales.
- [ ] Existe biblioteca multimedia.
- [ ] Existe auditoría.
- [ ] El formulario de contacto se administra como lead.
- [ ] El sitio es responsive.
- [ ] El sitio cumple objetivos básicos de accesibilidad.
- [ ] El build de producción finaliza sin errores.
- [ ] Existe backup y procedimiento de rollback.

---

# 36. Resultado final esperado

ALANTEK dejará de ser una adaptación visual del portafolio personal y se convertirá en una **plataforma corporativa administrable**, preparada para mostrar la empresa, sus servicios, su equipo y su experiencia técnica.

La arquitectura resultante deberá permitir que nuevos miembros, proyectos, servicios, clientes y contenidos se agreguen desde el panel administrativo sin modificar código, dejando una base escalable para futuras funciones como:

- portal de clientes;
- solicitud y seguimiento de cotizaciones;
- gestión de vacantes;
- documentación técnica;
- soporte/tickets;
- integración con CRM;
- catálogo de productos SaaS;
- panel de clientes;
- multiempresa.
