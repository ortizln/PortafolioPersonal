# Portafolio Profesional Interactivo

Plataforma web profesional de portafolio interactivo y administrable, construida con **Angular 18+**, **Node.js + Express**, **PostgreSQL** y **Prisma**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Angular](https://img.shields.io/badge/Angular-18+-red)
![Node](https://img.shields.io/badge/Node-20+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Características

### 🔥 Frontend
- **Angular 18+** con componentes standalone
- Diseño moderno con **glassmorphism** y animaciones profesionales
- **Tema oscuro/claro** con variables CSS
- Componentes **responsivos** (Desktop, Tablet, Mobile)
- **Lazy Loading** en todos los módulos
- Formularios reactivos con validaciones completas
- Interceptores HTTP para autenticación y manejo de errores
- Guards de protección de rutas
- **AOS** (Animate On Scroll) para animaciones fluidas
- Diseño inspirado en Apple, Stripe, Linear y Vercel

### ⚙️ Backend
- **Node.js + Express** con arquitectura limpia
- **Prisma ORM** para gestión de base de datos
- **JWT + Refresh Tokens** para autenticación segura
- Middleware de **rate limiting**, **helmet** y **CORS**
- Sistema de **roles** (ADMIN/USER)
- **Validaciones** robustas con express-validator
- **Swagger/OpenAPI** documentación automática
- Sistema de **upload** con multer y sharp
- **Logs** de auditoría
- Soft delete en todas las entidades

### 🗄️ Base de Datos
- **PostgreSQL** 16 con modelo normalizado
- 18 tablas con relaciones FK, índices y timestamps
- Soft delete y auditoría integrada

## 📋 Módulos

### Público
- **Hero**: Presentación profesional con estadísticas
- **Sobre Mí**: Historia, objetivos y filosofía
- **Experiencia**: Timeline interactivo
- **Educación**: Formación académica
- **Certificados**: Visor PDF y descargas
- **Proyectos**: Galería con filtros
- **Habilidades**: Barras animadas por categoría
- **Idiomas**: Niveles y porcentajes
- **Contacto**: Formulario con validación

### Administrativo
- **Dashboard**: Estadísticas y métricas
- **CRUD completo**: Perfil, Experiencias, Educación, Certificados, Proyectos, Skills, Idiomas, Redes Sociales, Repositorios, Categorías
- **Gestión de archivos**: Upload drag & drop, previews
- **Configuración**: Settings dinámicos
- **Mensajes**: Bandeja de entrada de contactos

## 🚀 Instalación

### Requisitos
- Node.js 20+
- PostgreSQL 16+
- Angular CLI 18+ (`npm install -g @angular/cli`)

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/portafolio-personal.git
cd portafolio-personal

# 2. Backend
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

# 3. Frontend
cd ../frontend
npm install
ng serve -o
```

### Variables de Entorno (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/portfolio_db"
JWT_SECRET=tu-secreto-jwt
JWT_REFRESH_SECRET=tu-secreto-refresh
CORS_ORIGIN=http://localhost:4200
```

### Docker

```bash
docker-compose up -d
```

## 🏗️ Estructura del Proyecto

```
portafolio-personal/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma    # Modelo de datos
│   ├── src/
│   │   ├── auth/            # JWT services
│   │   ├── config/          # Configuración
│   │   ├── controllers/     # Controladores API
│   │   ├── helpers/         # Utilidades
│   │   ├── middlewares/     # Middleware (auth, error)
│   │   ├── routes/          # Rutas API
│   │   ├── swagger/         # Documentación
│   │   ├── validations/     # Validaciones
│   │   └── app.js           # Entry point
│   └── uploads/             # Archivos subidos
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── auth/        # Login/Register
│       │   ├── core/        # Guards, interceptors, services
│       │   ├── dashboard/   # Admin dashboard
│       │   ├── experiences/ # Admin experiencias
│       │   ├── education/   # Admin educación
│       │   ├── certificates/# Admin certificados
│       │   ├── projects/    # Admin proyectos
│       │   ├── skills/      # Admin habilidades
│       │   ├── languages/   # Admin idiomas
│       │   ├── social-links/# Admin redes sociales
│       │   ├── repositories/# Admin repositorios
│       │   ├── categories/  # Admin categorías
│       │   ├── settings/    # Admin configuración
│       │   ├── public-portfolio/ # Vista pública
│       │   └── shared/      # Componentes compartidos
│       └── environments/    # Configuración
├── docker-compose.yml
└── README.md
```

## 🔌 API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh-token` | Refrescar token |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Perfil actual |

### Público
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/public/portfolio` | Portafolio completo |
| GET | `/api/public/projects` | Proyectos públicos |
| GET | `/api/public/experiences` | Experiencias |
| GET | `/api/public/education` | Educación |
| GET | `/api/public/certifications` | Certificados |
| GET | `/api/public/skills` | Habilidades |

### Admin (requiere autenticación)
CRUD completo para: `/profile`, `/experiences`, `/education`, `/certifications`, `/projects`, `/skills`, `/languages`, `/social-links`, `/repositories`, `/categories`, `/contact`, `/settings`, `/uploads`

Documentación completa en: `http://localhost:3000/api-docs`

## 🛠️ Tecnologías

### Frontend
- Angular 18+
- Bootstrap 5 + Bootstrap Icons
- Angular Material
- SCSS + CSS Variables
- AOS (Animate on Scroll)
- Chart.js / ngx-charts
- RxJS

### Backend
- Node.js + Express
- Prisma ORM
- JWT + Refresh Tokens
- Multer + Sharp
- Helmet + CORS + Rate Limiting
- Swagger/OpenAPI
- Morgan + Winston

### Base de Datos
- PostgreSQL 16
- Relaciones normalizadas
- Índices + Soft Delete + Timestamps

### DevOps
- Docker + Docker Compose
- Nginx
- PM2 (opcional)
- Git + GitHub/GitLab

## 🔒 Seguridad
- JWT con refresh tokens
- Passwords hasheadas con bcryptjs
- Rate limiting por IP
- Helmet headers de seguridad
- Sanitización de inputs
- Validación de tipos MIME en uploads
- Protección CSRF
- Roles y permisos

## 📱 Responsive Design
- **Desktop**: Diseño completo con sidebar y layouts complejos
- **Tablet**: Layout adaptativo con navegación colapsable
- **Mobile**: Navegación tipo drawer, cards verticales, tipografía adaptativa

## 🚢 Despliegue

### Producción

```bash
# Backend
cd backend
NODE_ENV=production npm start

# Frontend
cd frontend
ng build --configuration production
# Servir con nginx (ver nginx.conf)
```

### Docker
```bash
docker-compose up -d --build
```

## 📄 Licencia
MIT © [Tu Nombre]

---

<p align="center">
  Hecho con ❤️ y ☕ por <a href="https://github.com/tu-usuario">tu-usuario</a>
</p>
