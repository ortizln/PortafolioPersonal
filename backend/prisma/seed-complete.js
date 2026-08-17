/**
 * seed-complete.js — Seed completo ALANTEK
 *
 * Migra datos DevBlackSheep existentes al modelo corporativo + crea datos realistas.
 * Idempotente: puede ejecutarse múltiples veces sin crear duplicados.
 *
 * Uso:
 *   node prisma/seed-complete.js
 *   node prisma/seed-complete.js --dry-run    (solo muestra qué haría)
 *   node prisma/seed-complete.js --reset       (borra datos corporativos antes de seed)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');
const RESET = process.argv.includes('--reset');

function slugify(text) {
  return (text || '').toString().toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function log(tag, msg) {
  console.log(`[${tag}] ${msg}`);
}

function slugExists(slug, seen) {
  if (seen.has(slug)) {
    let i = 2;
    while (seen.has(`${slug}-${i}`)) i++;
    slug = `${slug}-${i}`;
  }
  seen.add(slug);
  return slug;
}

const projectSlugs = new Set();
const postSlugs = new Set();
const catSlugs = new Set();

// ─── RBAC ───────────────────────────────────────────────────────────────────

const PERMISSIONS = [
  { name: 'company.read', module: 'company', description: 'Ver información corporativa' },
  { name: 'company.update', module: 'company', description: 'Editar información corporativa' },
  { name: 'team.read', module: 'team', description: 'Ver equipo' },
  { name: 'team.create', module: 'team', description: 'Crear miembros de equipo' },
  { name: 'team.update', module: 'team', description: 'Editar miembros de equipo' },
  { name: 'team.delete', module: 'team', description: 'Eliminar miembros de equipo' },
  { name: 'projects.read', module: 'projects', description: 'Ver proyectos' },
  { name: 'projects.create', module: 'projects', description: 'Crear proyectos' },
  { name: 'projects.update', module: 'projects', description: 'Editar proyectos' },
  { name: 'projects.delete', module: 'projects', description: 'Eliminar proyectos' },
  { name: 'projects.publish', module: 'projects', description: 'Publicar proyectos' },
  { name: 'services.manage', module: 'services', description: 'Gestionar servicios' },
  { name: 'clients.manage', module: 'clients', description: 'Gestionar clientes' },
  { name: 'testimonials.manage', module: 'testimonials', description: 'Gestionar testimonios' },
  { name: 'categories.manage', module: 'projects', description: 'Gestionar categorías' },
  { name: 'technologies.manage', module: 'projects', description: 'Gestionar tecnologías' },
  { name: 'posts.manage', module: 'posts', description: 'Gestionar publicaciones' },
  { name: 'posts.publish', module: 'posts', description: 'Publicar contenido' },
  { name: 'media.upload', module: 'media', description: 'Subir archivos' },
  { name: 'media.manage', module: 'media', description: 'Gestionar biblioteca multimedia' },
  { name: 'messages.read', module: 'commercial', description: 'Ver mensajes y leads' },
  { name: 'messages.update', module: 'commercial', description: 'Actualizar mensajes y leads' },
  { name: 'users.manage', module: 'system', description: 'Gestionar usuarios' },
  { name: 'roles.manage', module: 'system', description: 'Gestionar roles y permisos' },
  { name: 'settings.manage', module: 'system', description: 'Gestionar configuración' },
  { name: 'audit.read', module: 'system', description: 'Ver registros de auditoría' },
  { name: 'notifications.read', module: 'system', description: 'Ver notificaciones' },
];

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Acceso total al sistema', permissions: PERMISSIONS.map(p => p.name) },
  { name: 'ADMIN', description: 'Administra contenido y operación del sitio', permissions: PERMISSIONS.filter(p => !['users.manage', 'roles.manage', 'settings.manage', 'audit.read'].includes(p.name)).map(p => p.name) },
  { name: 'CONTENT_MANAGER', description: 'Gestiona contenido corporativo y del blog', permissions: ['company.read', 'company.update', 'team.read', 'team.update', 'services.manage', 'clients.manage', 'testimonials.manage', 'categories.manage', 'technologies.manage', 'posts.manage', 'posts.publish', 'media.upload', 'media.manage', 'projects.read', 'projects.update', 'messages.read'] },
  { name: 'PROJECT_MANAGER', description: 'Gestiona proyectos y portafolio', permissions: ['projects.read', 'projects.create', 'projects.update', 'projects.delete', 'projects.publish', 'categories.manage', 'technologies.manage', 'media.upload', 'team.read', 'messages.read'] },
  { name: 'TEAM_MEMBER', description: 'Colaborador del equipo', permissions: ['projects.read', 'team.read', 'company.read', 'messages.read', 'media.upload'] },
  { name: 'VIEWER', description: 'Solo lectura', permissions: ['company.read', 'team.read', 'projects.read', 'messages.read'] },
];

async function seedRbac() {
  log('rbac', 'Verificando permisos y roles...');
  const permMap = {};
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: { module: p.module, description: p.description },
      create: p,
    });
    permMap[p.name] = perm.id;
  }
  log('rbac', `${PERMISSIONS.length} permisos OK`);

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isSystem: true },
      create: { name: r.name, description: r.description, isSystem: true },
    });
    const current = await prisma.rolePermission.findMany({ where: { roleId: role.id }, select: { permissionId: true } });
    const currentIds = new Set(current.map(c => c.permissionId));
    for (const permName of r.permissions) {
      const permId = permMap[permName];
      if (permId && !currentIds.has(permId)) {
        await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permId } });
      }
    }
  }
  log('rbac', `${ROLES.length} roles OK`);
}

async function assignAdminRole(userId) {
  const role = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (!role) return;
  const existing = await prisma.userRole.findUnique({ where: { userId_roleId: { userId, roleId: role.id } } });
  if (!existing) {
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
    await prisma.user.update({ where: { id: userId }, data: { roleId: role.id } });
  }
}

// ─── ADMIN USER ─────────────────────────────────────────────────────────────

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@portfolio.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    log('admin', `Usuario ${email} ya existe (${existing.id})`);
    await assignAdminRole(existing.id);
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: 'Alan Tek',
      role: 'ADMIN',
      profile: {
        create: {
          fullName: 'Alan Tek',
          professionalTitle: 'Full Stack Developer & Tech Lead',
          description: 'Desarrollador Full Stack con experiencia en arquitecturas escalables, liderazgo técnico y transformación digital.',
          biography: 'Fundador de ALANTEK, empresa de desarrollo de software y consultoría tecnológica. Con más de 5 años de experiencia liderando equipos y entregando soluciones digitales de alto impacto para clientes en diversos sectores.',
          aboutMe: 'Apasionado por la tecnología y la innovación. Mi enfoque combina excelencia técnica con visión de negocio para crear productos digitales que generan valor real.',
          professionalStory: 'Comencé mi carrera como desarrollador frontend, evolucionando rápidamente hacia roles de arquitecto y tech lead. La fundación de ALANTEK marcó el inicio de una nueva etapa donde combino desarrollo técnico con consultoría estratégica.',
          objectives: 'Liderar proyectos de transformación digital que impulsen el crecimiento de nuestros clientes, manteniendo los más altos estándares de calidad y innovación.',
          workPhilosophy: 'Creo en el desarrollo iterativo, la comunicación transparente y la mejora continua. Cada proyecto es una oportunidad para superar expectativas.',
          specialties: 'Arquitectura de microservicios, desarrollo Full Stack, DevOps, liderazgo técnico, transformación digital',
          email,
          phone: '+57 300 123 4567',
          location: 'Bogotá, Colombia',
          website: 'https://alantek.co',
          quickStats: JSON.stringify({ projects: 0, experience: 5, certifications: 3, technologies: 15 }),
        },
      },
    },
    include: { profile: true },
  });

  await assignAdminRole(user.id);
  log('admin', `Admin creado: ${email} (${user.id})`);
  return user;
}

// ─── COMPANY ────────────────────────────────────────────────────────────────

async function seedCompany() {
  const existing = await prisma.company.findFirst();
  if (existing) {
    log('company', `Ya existe: ${existing.name}`);
    return existing;
  }

  const company = await prisma.company.create({
    data: {
      name: 'ALANTEK',
      slug: 'alantek',
      legalName: 'ALANTEK S.A.S.',
      slogan: 'Innovación que impulsa tu negocio',
      description: 'Empresa de desarrollo de software y consultoría tecnológica especializada en soluciones Full Stack, arquitecturas escalables y transformación digital.',
      mission: 'Empoderar a las empresas con tecnología de vanguardia, entregando soluciones digitales innovadoras que aceleran el crecimiento y la eficiencia operativa.',
      vision: 'Ser reconocidos como líderes en desarrollo de software y consultoría tecnológica en Latinoamérica, distinguiéndonos por la calidad, la innovación y el impacto en nuestros clientes.',
      history: 'Fundada en 2020, ALANTEK nació de la visión de crear una empresa de tecnología que combine expertise técnico con visión estratégica. Desde entonces, hemos crecido para servir a clientes en sectores como finanzas, salud, educación y comercio.',
      email: 'contacto@alantek.co',
      phone: '+57 300 123 4567',
      website: 'https://alantek.co',
      address: 'Bogotá, Colombia',
      foundedYear: 2020,
      primaryColor: '#2563eb',
      secondaryColor: '#22d3ee',
      heroImageUrl: null,
      logoUrl: null,
      seoTitle: 'ALANTEK — Desarrollo de Software y Consultoría Tecnológica',
      seoDescription: 'ALANTEK: soluciones de desarrollo Full Stack, arquitecturas escalables y transformación digital para empresas.',
      isActive: true,
    },
  });
  log('company', `Creada: ${company.name}`);
  return company;
}

// ─── TECHNOLOGIES ───────────────────────────────────────────────────────────

async function seedTechnologies() {
  const techs = [
    { name: 'Angular', category: 'FRONTEND', color: '#DD0031', icon: 'angular', website: 'https://angular.dev' },
    { name: 'React', category: 'FRONTEND', color: '#61DAFB', icon: 'react', website: 'https://react.dev' },
    { name: 'Vue.js', category: 'FRONTEND', color: '#4FC08D', icon: 'vuejs', website: 'https://vuejs.org' },
    { name: 'Next.js', category: 'FRONTEND', color: '#000000', icon: 'nextjs', website: 'https://nextjs.org' },
    { name: 'Node.js', category: 'BACKEND', color: '#339933', icon: 'nodejs', website: 'https://nodejs.org' },
    { name: 'Express', category: 'BACKEND', color: '#000000', icon: 'express', website: 'https://expressjs.com' },
    { name: 'NestJS', category: 'BACKEND', color: '#E0234E', icon: 'nestjs', website: 'https://nestjs.com' },
    { name: 'TypeScript', category: 'FRONTEND', color: '#3178C6', icon: 'typescript', website: 'https://typescriptlang.org' },
    { name: 'JavaScript', category: 'FRONTEND', color: '#F7DF1E', icon: 'javascript', website: 'https://javascript.info' },
    { name: 'Python', category: 'BACKEND', color: '#3776AB', icon: 'python', website: 'https://python.org' },
    { name: 'PostgreSQL', category: 'DATABASE', color: '#4169E1', icon: 'postgresql', website: 'https://postgresql.org' },
    { name: 'MongoDB', category: 'DATABASE', color: '#47A248', icon: 'mongodb', website: 'https://mongodb.com' },
    { name: 'Redis', category: 'DATABASE', color: '#DC382D', icon: 'redis', website: 'https://redis.io' },
    { name: 'GraphQL', category: 'BACKEND', color: '#E10098', icon: 'graphql', website: 'https://graphql.org' },
    { name: 'Docker', category: 'DEVOPS', color: '#2496ED', icon: 'docker', website: 'https://docker.com' },
    { name: 'Kubernetes', category: 'DEVOPS', color: '#326CE5', icon: 'kubernetes', website: 'https://kubernetes.io' },
    { name: 'AWS', category: 'CLOUD', color: '#FF9900', icon: 'aws', website: 'https://aws.amazon.com' },
    { name: 'Firebase', category: 'CLOUD', color: '#FFCA28', icon: 'firebase', website: 'https://firebase.google.com' },
    { name: 'Git', category: 'DEVOPS', color: '#F05032', icon: 'git', website: 'https://git-scm.com' },
    { name: 'TailwindCSS', category: 'FRONTEND', color: '#06B6D4', icon: 'tailwindcss', website: 'https://tailwindcss.com' },
    { name: 'Sass', category: 'FRONTEND', color: '#CC6699', icon: 'sass', website: 'https://sass-lang.com' },
    { name: 'Bootstrap', category: 'FRONTEND', color: '#7952B3', icon: 'bootstrap', website: 'https://getbootstrap.com' },
    { name: 'Flutter', category: 'MOBILE', color: '#02569B', icon: 'flutter', website: 'https://flutter.dev' },
    { name: 'Prisma', category: 'DATABASE', color: '#2D3748', icon: 'prisma', website: 'https://prisma.io' },
    { name: 'GitHub Actions', category: 'DEVOPS', color: '#2088FF', icon: 'github', website: 'https://github.com/features/actions' },
  ];

  let count = 0;
  for (const t of techs) {
    const existing = await prisma.technology.findUnique({ where: { name: t.name } });
    if (!existing) {
      await prisma.technology.create({ data: t });
      count++;
    }
  }
  log('tech', `${count} tecnologías nuevas (${techs.length} total)`);
  return techs;
}

// ─── TEAM MEMBERS ───────────────────────────────────────────────────────────

async function seedTeamMembers() {
  const existing = await prisma.teamMember.findFirst();
  if (existing) {
    log('team', `Ya existen miembros, omitiendo creación.`);
    return existing;
  }

  const admin = await prisma.user.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } });
  if (!admin) {
    log('team', 'No hay admin, saltando team members.');
    return null;
  }

  const founder = await prisma.teamMember.create({
    data: {
      slug: 'alan-tek',
      fullName: 'Alan Tek',
      professionalTitle: 'Founder & Tech Lead',
      email: admin.email,
      phone: '+57 300 123 4567',
      location: 'Bogotá, Colombia',
      bio: 'Fundador de ALANTEK. Full Stack Developer con experiencia en arquitecturas escalables y liderazgo técnico.',
      about: 'Líder técnico con más de 5 años de experiencia en desarrollo de software. Especializado en arquitecturas Full Stack con Angular, Node.js y cloud computing.',
      photoUrl: null,
      linkedinUrl: 'https://linkedin.com/in/alantek',
      githubUrl: 'https://github.com/alantek',
      twitterUrl: 'https://twitter.com/alantek',
      isFounder: true,
      isActive: true,
      isPublic: true,
    },
  });

  const member2 = await prisma.teamMember.create({
    data: {
      slug: 'maria-garcia',
      fullName: 'María García',
      professionalTitle: 'Frontend Developer',
      email: 'maria@alantek.co',
      location: 'Bogotá, Colombia',
      bio: 'Frontend Developer especializada en Angular y用户体验.',
      about: 'Desarrolladora frontend con 3 años de experiencia creando interfaces modernas y accesibles.',
      isFounder: false,
      isActive: true,
      isPublic: true,
    },
  });

  const member3 = await prisma.teamMember.create({
    data: {
      slug: 'carlos-lopez',
      fullName: 'Carlos López',
      professionalTitle: 'Backend Developer',
      email: 'carlos@alantek.co',
      location: 'Medellín, Colombia',
      bio: 'Backend Developer especializado en Node.js, arquitecturas de microservicios y bases de datos.',
      about: 'Ingeniero de software con experiencia en APIs RESTful, microservicios y optimización de bases de datos.',
      isFounder: false,
      isActive: true,
      isPublic: true,
    },
  });

  log('team', `Creados 3 miembros: ${founder.fullName}, ${member2.fullName}, ${member3.fullName}`);

  // Vincular datos huérfanos al founder
  const userIds = [admin.id];
  const models = [
    { model: 'experience', key: 'experiences' },
    { model: 'education', key: 'educations' },
    { model: 'certification', key: 'certifications' },
    { model: 'skill', key: 'skills' },
    { model: 'language', key: 'languages' },
    { model: 'socialLink', key: 'socialLinks' },
  ];
  for (const { model, key } of models) {
    const updated = await prisma[model].updateMany({
      where: { memberId: null, userId: { in: userIds }, deletedAt: null },
      data: { memberId: founder.id },
    });
    if (updated.count > 0) log('team', `Vinculados ${updated.count} ${key} al founder`);
  }

  return founder;
}

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

async function seedCategories() {
  const cats = [
    { name: 'Web Application', slug: 'web-application', description: 'Aplicaciones web completas' },
    { name: 'Mobile App', slug: 'mobile-app', description: 'Aplicaciones móviles nativas y multiplataforma' },
    { name: 'E-commerce', slug: 'e-commerce', description: 'Tiendas en línea y plataformas de comercio' },
    { name: 'Enterprise', slug: 'enterprise', description: 'Soluciones empresariales y ERP' },
    { name: 'API & Microservices', slug: 'api-microservices', description: 'APIs, backends y arquitecturas de microservicios' },
  ];

  let count = 0;
  for (const c of cats) {
    const existing = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (!existing) {
      await prisma.category.create({ data: c });
      count++;
    }
  }
  log('categories', `${count} categorías nuevas (${cats.length} total)`);
  return cats;
}

// ─── SERVICES ───────────────────────────────────────────────────────────────

async function seedServices() {
  const existing = await prisma.service.findFirst();
  if (existing) {
    log('services', 'Ya existen servicios, omitiendo.');
    return;
  }

  const services = [
    {
      name: 'Desarrollo Web Full Stack',
      slug: 'desarrollo-web-full-stack',
      description: 'Creamos aplicaciones web robustas y escalables utilizando las tecnologías más modernas del mercado.',
      icon: 'bi-code-slash',
      isFeatured: true,
      features: [
        { name: 'Aplicaciones SPA y SSR', description: 'Single Page y Server-Side Rendering con Angular, React y Next.js', icon: 'bi-window', order: 1 },
        { name: 'APIs RESTful y GraphQL', description: 'Backends escalables con Node.js, NestJS y Express', icon: 'bi-hdd-network', order: 2 },
        { name: 'Bases de datos optimizadas', description: 'PostgreSQL, MongoDB, Redis para cada caso de uso', icon: 'bi-database', order: 3 },
        { name: 'Testing y CI/CD', description: 'Tests automatizados y despliegue continuo con GitHub Actions', icon: 'bi-check-circle', order: 4 },
      ],
      techNames: ['Angular', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    },
    {
      name: 'Aplicaciones Móviles',
      slug: 'aplicaciones-moviles',
      description: 'Desarrollamos apps móviles nativas y multiplataforma que ofrecen experiencias excepcionales.',
      icon: 'bi-phone',
      isFeatured: true,
      features: [
        { name: 'Multiplataforma', description: 'Una sola base de código para iOS y Android con Flutter', icon: 'bi-phone', order: 1 },
        { name: 'UI/UX Nativo', description: 'Experiencias que se sienten nativas en cada plataforma', icon: 'bi-hand-index', order: 2 },
        { name: 'Push Notifications', description: 'Notificaciones en tiempo real para mantener usuarios engaged', icon: 'bi-bell', order: 3 },
      ],
      techNames: ['Flutter', 'TypeScript', 'Firebase', 'Node.js'],
    },
    {
      name: 'Consultoría Cloud & DevOps',
      slug: 'consultoria-cloud-devops',
      description: 'Optimizamos tu infraestructura con soluciones cloud y prácticas DevOps de vanguardia.',
      icon: 'bi-cloud',
      isFeatured: true,
      features: [
        { name: 'Cloud Migration', description: 'Migración segura a AWS, GCP o Azure', icon: 'bi-arrow-up-circle', order: 1 },
        { name: 'Containerización', description: 'Docker y Kubernetes para despliegues consistentes', icon: 'bi-box', order: 2 },
        { name: 'CI/CD Pipeline', description: 'Pipelines automatizados con GitHub Actions, Jenkins o GitLab CI', icon: 'bi-gear', order: 3 },
        { name: 'Monitoreo', description: 'Observabilidad completa con métricas, logs y alertas', icon: 'bi-graph-up', order: 4 },
      ],
      techNames: ['Docker', 'Kubernetes', 'AWS', 'Git', 'GitHub Actions'],
    },
    {
      name: 'Transformación Digital',
      slug: 'transformacion-digital',
      description: 'Modernizamos procesos y sistemas legacy con soluciones digitales innovadoras.',
      icon: 'bi-rocket',
      isFeatured: false,
      features: [
        { name: 'Auditoría técnica', description: 'Análisis completo de tu stack actual y recomendaciones', icon: 'bi-search', order: 1 },
        { name: 'Modernización', description: 'Migración de sistemas legacy a arquitecturas modernas', icon: 'bi-arrow-repeat', order: 2 },
        { name: 'Automatización', description: 'Automatización de procesos manuales con flujos digitales', icon: 'bi-lightning', order: 3 },
      ],
      techNames: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    },
    {
      name: 'UI/UX Design',
      slug: 'ui-ux-design',
      description: 'Diseñamos interfaces intuitivas y atractivas centradas en el usuario.',
      icon: 'bi-palette',
      isFeatured: false,
      features: [
        { name: 'User Research', description: 'Investigación de usuarios para fundamentar decisiones de diseño', icon: 'bi-people', order: 1 },
        { name: 'Prototipado', description: 'Prototipos interactivos para validación rápida', icon: 'bi-pencil', order: 2 },
        { name: 'Design System', description: 'Sistemas de diseño escalables y consistentes', icon: 'bi-grid', order: 3 },
      ],
      techNames: ['TailwindCSS', 'Sass', 'Bootstrap', 'Angular', 'React'],
    },
  ];

  for (const s of services) {
    const { techNames, features, ...serviceData } = s;
    const service = await prisma.service.create({ data: { ...serviceData, status: 'ACTIVE' } });

    for (const f of features) {
      await prisma.serviceFeature.create({ data: { ...f, serviceId: service.id } });
    }

    for (const techName of techNames) {
      const tech = await prisma.technology.findUnique({ where: { name: techName } });
      if (tech) {
        await prisma.serviceTechnology.create({ data: { serviceId: service.id, technologyId: tech.id } });
      }
    }
  }
  log('services', `${services.length} servicios creados`);
}

// ─── CLIENTS ────────────────────────────────────────────────────────────────

async function seedClients() {
  const existing = await prisma.client.findFirst();
  if (existing) {
    log('clients', 'Ya existen clientes, omitiendo.');
    return;
  }

  const clients = [
    { name: 'TechStart Inc', slug: 'techstart', industry: 'Fintech', logoUrl: null, isFeatured: true },
    { name: 'GlobalRetail', slug: 'globalretail', industry: 'Retail', logoUrl: null, isFeatured: true },
    { name: 'MedConnect', slug: 'medconnect', industry: 'Salud', logoUrl: null, isFeatured: false },
    { name: 'EduPlatform', slug: 'eduplatform', industry: 'Educación', logoUrl: null, isFeatured: false },
    { name: 'FinSecure', slug: 'finsecure', industry: 'Finanzas', logoUrl: null, isFeatured: true },
  ];

  for (const c of clients) {
    await prisma.client.create({ data: c });
  }
  log('clients', `${clients.length} clientes creados`);
}

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────

async function seedTestimonials() {
  const existing = await prisma.testimonial.findFirst();
  if (existing) {
    log('testimonials', 'Ya existen testimonios, omitiendo.');
    return;
  }

  const testimonials = [
    {
      authorName: 'Carlos Mendoza',
      authorPosition: 'CTO, TechStart Inc',
      content: 'ALANTEK transformó nuestra visión en una plataforma robusta y escalable. Su conocimiento técnico y capacidad de entrega superaron nuestras expectativas.',
      rating: 5,
      isPublished: true,
      isFeatured: true,
      clientSlug: 'techstart',
    },
    {
      authorName: 'Laura Fernández',
      authorPosition: 'VP de Tecnología, GlobalRetail',
      content: 'El equipo de ALANTEK nos ayudó a modernizar nuestro e-commerce con una arquitectura que soporta miles de transacciones diarias. Excelente trabajo.',
      rating: 5,
      isPublished: true,
      isFeatured: true,
      clientSlug: 'globalretail',
    },
    {
      authorName: 'Dr. Andrés Peña',
      authorPosition: 'Director de Innovación, MedConnect',
      content: 'La aplicación móvil que desarrollaron para nosotros ha mejorado significativamente la experiencia de nuestros pacientes. Profesionales de primera.',
      rating: 5,
      isPublished: true,
      isFeatured: false,
      clientSlug: 'medconnect',
    },
    {
      authorName: 'María Rodríguez',
      authorPosition: 'CEO, EduPlatform',
      content: 'Trabajar con ALANTEK fue una experiencia excepcional. Entregaron a tiempo, con calidad y siempre dispuestos a iterar para lograr el mejor resultado.',
      rating: 4,
      isPublished: true,
      isFeatured: false,
      clientSlug: 'eduplatform',
    },
  ];

  for (const t of testimonials) {
    const { clientSlug, ...data } = t;
    const client = await prisma.client.findUnique({ where: { slug: clientSlug } });
    if (client) {
      await prisma.testimonial.create({ data: { ...data, clientId: client.id } });
    }
  }
  log('testimonials', `${testimonials.length} testimonios creados`);
}

// ─── PROJECTS ───────────────────────────────────────────────────────────────

async function seedProjects() {
  const existing = await prisma.project.findFirst();
  if (existing) {
    log('projects', 'Ya existen proyectos, omitiendo.');
    return;
  }

  const projects = [
    {
      title: 'Plataforma E-commerce TechStart',
      slug: slugify('Plataforma E-commerce TechStart'),
      description: 'Plataforma de comercio electrónico completa con catálogo de productos, carrito de compras, pasarela de pagos y panel de administración.',
      summary: 'E-commerce escalable con Node.js y Angular, integrado con pasarela de pagos y sistema de inventario en tiempo real.',
      status: 'COMPLETED',
      visibility: 'PUBLIC',
      isFeatured: true,
      isCaseStudy: true,
      challenge: 'TechStart necesitaba migrar su tienda legacy a una plataforma moderna que pudiera soportar tráfico alto durante campañas de marketing sin degradar el rendimiento.',
      solution: 'Implementamos una arquitectura de microservicios con Angular en el frontend, Node.js/NestJS en el backend, PostgreSQL para datos transaccionales y Redis para caché. El sistema de pagos se integró con Stripe y la infraestructura se containerizó con Docker.',
      results: 'La nueva plataforma soporta 10,000+ usuarios concurrentes, el tiempo de carga se redujo 65%, y las ventas aumentaron un 40% en los primeros 3 meses.',
      metrics: JSON.stringify({ users: 10000, performance: '65% faster', revenue: '+40%' }),
      clientSlug: 'techstart',
      categorySlug: 'e-commerce',
      techNames: ['Angular', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'TypeScript'],
      features: JSON.stringify(['Catálogo dinámico', 'Carrito persistente', 'Pagos con Stripe', 'Panel admin', 'Reportes de ventas']),
    },
    {
      title: 'App Móvil MedConnect',
      slug: slugify('App Móvil MedConnect'),
      description: 'Aplicación móvil para gestión de citas médicas, historial de pacientes y telemedicina.',
      summary: 'App multiplataforma con Flutter que conecta pacientes con profesionales de la salud.',
      status: 'COMPLETED',
      visibility: 'PUBLIC',
      isFeatured: true,
      isCaseStudy: true,
      challenge: 'MedConnect buscaba una solución que permitiera a sus pacientes agendar citas, acceder a su historial médico y realizar consultas por video, todo desde una sola app.',
      solution: 'Desarrollamos una app con Flutter para iOS y Android, backend en Node.js con PostgreSQL, integración de videollamadas con WebSockets y almacenamiento seguro de datos sensibles con encriptación AES-256.',
      results: 'La app fue descargada 15,000+ veces en el primer mes, con un 92% de retención de usuarios y reducción del 35% en no-shows de citas.',
      metrics: JSON.stringify({ downloads: 15000, retention: '92%', noShows: '-35%' }),
      clientSlug: 'medconnect',
      categorySlug: 'mobile-app',
      techNames: ['Flutter', 'Node.js', 'PostgreSQL', 'Firebase'],
      features: JSON.stringify(['Agendamiento de citas', 'Historial médico', 'Telemedicina', 'Notificaciones push', 'Pagos integrados']),
    },
    {
      title: 'Dashboard Analytics GlobalRetail',
      slug: slugify('Dashboard Analytics GlobalRetail'),
      description: 'Panel de analytics en tiempo real para monitoreo de ventas, inventario y comportamiento de clientes.',
      summary: 'Dashboard interactivo con Angular y gráficas dinámicas para toma de decisiones basada en datos.',
      status: 'COMPLETED',
      visibility: 'PUBLIC',
      isFeatured: true,
      isCaseStudy: false,
      challenge: 'GlobalRetail necesitaba una vista unificada de sus métricas de negocio dispersas en múltiples sistemas.',
      solution: 'Creamos un dashboard con Angular que consume datos de múltiples fuentes via GraphQL, con gráficas interactivas usando D3.js y actualizaciones en tiempo real.',
      results: 'El dashboard redujo el tiempo de generación de reportes de 2 horas a tiempo real, y el equipo de ventas aumentó su productividad un 25%.',
      metrics: JSON.stringify({ reportTime: 'real-time', productivity: '+25%' }),
      clientSlug: 'globalretail',
      categorySlug: 'web-application',
      techNames: ['Angular', 'GraphQL', 'Node.js', 'PostgreSQL'],
      features: JSON.stringify(['Gráficas interactivas', 'Filtros dinámicos', 'Exportación PDF', 'Actualización en tiempo real', 'Multi-tenant']),
    },
    {
      title: 'Sistema ERP Cloud FinSecure',
      slug: slugify('Sistema ERP Cloud FinSecure'),
      description: 'Sistema ERP en la nube para gestión financiera, contabilidad y recursos humanos.',
      summary: 'ERP modular construido con arquitectura de microservicios, desplegado en AWS con alta disponibilidad.',
      status: 'IN_PROGRESS',
      visibility: 'PUBLIC',
      isFeatured: true,
      isCaseStudy: true,
      challenge: 'FinSecure necesitaba reemplazar su ERP legacy por una solución cloud que pudiera escalar con el crecimiento de la empresa y cumplir con regulaciones financieras.',
      solution: 'Diseñamos una arquitectura de microservicios con NestJS, desplegada en AWS EKS (Kubernetes), con PostgreSQL por módulo, autenticación OAuth2 y auditoría completa de transacciones.',
      results: 'En fase de implementación. Primer módulo (Contabilidad) en producción con 50+ usuarios activos y cero downtime en las primeras 4 semanas.',
      metrics: JSON.stringify({ modules: 4, uptime: '99.99%', users: 50 }),
      clientSlug: 'finsecure',
      categorySlug: 'enterprise',
      techNames: ['NestJS', 'PostgreSQL', 'Kubernetes', 'AWS', 'Docker', 'TypeScript'],
      features: JSON.stringify(['Módulo contable', 'Gestión de RRHH', 'Reportes financieros', 'Cumplimiento normativo', 'Auditoría automática']),
    },
    {
      title: 'Plataforma EduPlatform LMS',
      slug: slugify('Plataforma EduPlatform LMS'),
      description: 'Sistema de gestión de aprendizaje con cursos, evaluaciones, progreso de estudiantes y certificaciones.',
      summary: 'LMS completo con Next.js y Node.js, soporte para video streaming y evaluaciones interactivas.',
      status: 'COMPLETED',
      visibility: 'PUBLIC',
      isFeatured: false,
      isCaseStudy: false,
      challenge: 'EduPlatform quería una plataforma educativa moderna que pudiera competir con LMS established pero con una UX superior.',
      solution: 'Construimos un LMS con Next.js (SSR/SSG) para performance, Node.js para la API, MongoDB para contenido flexible, y integración con AWS CloudFront para streaming de video.',
      results: 'La plataforma tiene 500+ estudiantes activos, 50+ cursos publicados, y un NPS de 72.',
      metrics: JSON.stringify({ students: 500, courses: 50, nps: 72 }),
      clientSlug: 'eduplatform',
      categorySlug: 'web-application',
      techNames: ['Next.js', 'Node.js', 'MongoDB', 'AWS', 'TypeScript'],
      features: JSON.stringify(['Cursos con video', 'Evaluaciones interactivas', 'Progreso de estudiantes', 'Certificaciones', 'Dashboard de analytics']),
    },
    {
      title: 'API Gateway Microservicios',
      slug: slugify('API Gateway Microservicios'),
      description: 'Gateway centralizado para orquestación de microservicios con rate limiting, autenticación y monitoreo.',
      summary: 'API Gateway escalable con NestJS, Redis para caché y rate limiting, desplegado en Kubernetes.',
      status: 'COMPLETED',
      visibility: 'PUBLIC',
      isFeatured: false,
      isCaseStudy: false,
      challenge: 'Necesitábamos una capa de orquestación que unificara el acceso a múltiples microservicios internos.',
      solution: 'Implementamos un API Gateway con NestJS que maneja autenticación JWT, rate limiting con Redis, circuit breaker, y métricas con Prometheus.',
      results: 'El gateway procesa 50,000+ requests/día con latencia promedio de 45ms. Redujo la complejidad de los clientes en un 60%.',
      metrics: JSON.stringify({ requests: 50000, latency: '45ms', complexity: '-60%' }),
      categorySlug: 'api-microservices',
      techNames: ['NestJS', 'Redis', 'Docker', 'Kubernetes', 'PostgreSQL'],
      features: JSON.stringify(['Rate limiting', 'JWT Authentication', 'Circuit breaker', 'Load balancing', 'Request logging']),
    },
  ];

  const founder = await prisma.teamMember.findFirst({ where: { isFounder: true } });
  const admin = await prisma.user.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } });

  for (const p of projects) {
    const { clientSlug, categorySlug, techNames, ...data } = p;
    const client = clientSlug ? await prisma.client.findUnique({ where: { slug: clientSlug } }) : null;
    const category = categorySlug ? await prisma.category.findUnique({ where: { slug: categorySlug } }) : null;

    const project = await prisma.project.create({
      data: {
        ...data,
        clientId: client?.id || null,
        userId: admin.id,
        views: Math.floor(Math.random() * 500) + 50,
      },
    });

    if (category) {
      await prisma.projectCategory.create({ data: { projectId: project.id, categoryId: category.id } });
    }

    for (const techName of techNames) {
      const tech = await prisma.technology.findUnique({ where: { name: techName } });
      if (tech) {
        await prisma.projectTechnology.create({ data: { projectId: project.id, technologyId: tech.id } });
      }
    }

    if (founder) {
      await prisma.projectMember.create({ data: { projectId: project.id, teamMemberId: founder.id, role: 'Tech Lead', isLead: true } });
    }
  }
  log('projects', `${projects.length} proyectos creados`);
}

// ─── POSTS (BLOG) ───────────────────────────────────────────────────────────

async function seedPosts() {
  const existing = await prisma.post.findFirst();
  if (existing) {
    log('posts', 'Ya existen posts, omitiendo.');
    return;
  }

  const admin = await prisma.user.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } });

  const categories = [
    { name: 'Desarrollo Web', slug: 'desarrollo-web' },
    { name: 'DevOps', slug: 'devops' },
    { name: 'Arquitectura', slug: 'arquitectura' },
    { name: 'Tips & Trucos', slug: 'tips-trucos' },
  ];

  const postCategories = {};
  for (const c of categories) {
    const existing = await prisma.postCategory.findUnique({ where: { slug: c.slug } });
    if (!existing) {
      const cat = await prisma.postCategory.create({ data: c });
      postCategories[c.slug] = cat;
    } else {
      postCategories[c.slug] = existing;
    }
  }

  const tags = ['Angular', 'Node.js', 'TypeScript', 'Docker', 'PostgreSQL', 'Best Practices', 'Tutorial'];
  const postTags = {};
  for (const t of tags) {
    const slug = slugify(t);
    const existing = await prisma.postTag.findUnique({ where: { slug } });
    if (!existing) {
      const tag = await prisma.postTag.create({ data: { name: t, slug } });
      postTags[slug] = tag;
    } else {
      postTags[slug] = existing;
    }
  }

  const posts = [
    {
      title: 'Building Scalable APIs with NestJS and PostgreSQL',
      slug: slugify('Building Scalable APIs with NestJS and PostgreSQL'),
      content: `# Building Scalable APIs with NestJS and PostgreSQL\n\nNestJS has become one of the most popular frameworks for building enterprise-grade APIs in Node.js. In this article, we explore best practices for creating scalable, maintainable APIs.\n\n## Why NestJS?\n\nNestJS provides an out-of-the-box application architecture that embraces modern JavaScript, makes it easy to write highly testable, loosely coupled, and easily maintainable applications.\n\n## Key Architecture Patterns\n\n### Modular Design\nOrganize your application into feature modules. Each module encapsulates a specific domain area with its own controllers, services, and entities.\n\n### Dependency Injection\nNestJS's built-in DI container makes it easy to manage dependencies and creates loosely coupled classes that are easier to test.\n\n### Guards and Interceptors\nUse guards for authentication/authorization and interceptors for cross-cutting concerns like logging, caching, and transformation.\n\n## Database Integration with Prisma\n\nPrisma provides a type-safe ORM that integrates seamlessly with NestJS, offering excellent developer experience and migration management.\n\n## Conclusion\n\nNestJS combined with PostgreSQL and Prisma gives you a powerful, type-safe stack for building production-ready APIs.`,
      excerpt: 'A comprehensive guide to building scalable APIs using NestJS framework with PostgreSQL database and Prisma ORM.',
      status: 'PUBLISHED',
      seoTitle: 'Building Scalable APIs with NestJS and PostgreSQL | ALANTEK Blog',
      seoDescription: 'Learn best practices for building scalable, maintainable APIs with NestJS, PostgreSQL, and Prisma.',
      views: 342,
      authorId: admin?.id,
      categorySlugs: ['arquitectura'],
      tagSlugs: ['nodejs', 'typescript', 'best-practices'],
    },
    {
      title: 'Angular 19: What\'s New and Why It Matters',
      slug: slugify('Angular 19: What\'s New and Why It Matters'),
      content: `# Angular 19: What's New and Why It Matters\n\nAngular continues to evolve with version 19, bringing exciting new features that improve developer experience and application performance.\n\n## New Features\n\n### Improved Signals\nSignals get better interop with RxJS, making the transition from observable-based patterns smoother.\n\n### Enhanced SSR\nServer-side rendering improvements include better hydration and streaming capabilities.\n\n### Built-in Control Flow\nThe new built-in control flow syntax (@if, @for, @switch) becomes the default, offering better performance and smaller bundle sizes.\n\n## Migration Guide\n\nUpgrading from Angular 18 is straightforward with the Angular CLI update tool. Most changes are automatically migrated.\n\n## Performance Improvements\n\n- 20% smaller bundle sizes with tree-shaking improvements\n- Faster change detection with signal-based components\n- Improved build times with esbuild\n\n## Conclusion\n\nAngular 19 solidifies its position as a leading enterprise framework with these improvements.`,
      excerpt: 'Explore the new features in Angular 19 including improved signals, enhanced SSR, and built-in control flow.',
      status: 'PUBLISHED',
      seoTitle: 'Angular 19: New Features Guide | ALANTEK Blog',
      seoDescription: 'Complete guide to Angular 19 new features including signals, SSR, and performance improvements.',
      views: 567,
      authorId: admin?.id,
      categorySlugs: ['desarrollo-web'],
      tagSlugs: ['angular', 'typescript', 'tutorial'],
    },
    {
      title: 'Docker Best Practices for Production Deployments',
      slug: slugify('Docker Best Practices for Production Deployments'),
      content: `# Docker Best Practices for Production Deployments\n\nRunning Docker in production requires careful consideration of security, performance, and maintainability. Here are our battle-tested practices.\n\n## Multi-Stage Builds\n\nAlways use multi-stage builds to keep your production images small and secure. Separate build dependencies from runtime dependencies.\n\n## Security\n\n### Non-Root Users\nRun containers as non-root users to minimize the impact of potential vulnerabilities.\n\n### Image Scanning\nUse tools like Trivy or Snyk to scan images for known vulnerabilities before deployment.\n\n## Resource Management\n\n### Memory Limits\nAlways set memory limits to prevent a single container from consuming all host resources.\n\n### CPU Limits\nSet CPU limits for fair resource allocation in shared environments.\n\n## Logging\n\n### Structured Logging\nUse JSON structured logging for easy parsing and analysis with tools like ELK or Loki.\n\n### Log Rotation\nConfigure log rotation to prevent disk space exhaustion.\n\n## Conclusion\n\nFollowing these practices will help you run Docker containers safely and efficiently in production.`,
      excerpt: 'Battle-tested Docker best practices for security, performance, and maintainability in production environments.',
      status: 'PUBLISHED',
      seoTitle: 'Docker Best Practices for Production | ALANTEK Blog',
      seoDescription: 'Learn Docker best practices for production deployments including security, logging, and resource management.',
      views: 289,
      authorId: admin?.id,
      categorySlugs: ['devops'],
      tagSlugs: ['docker', 'best-practices'],
    },
    {
      title: 'GitOps Workflow with GitHub Actions and Kubernetes',
      slug: slugify('GitOps Workflow with GitHub Actions and Kubernetes'),
      content: `# GitOps Workflow with GitHub Actions and Kubernetes\n\nGitOps is a way to do Kubernetes cluster management and application delivery where Git is the single source of truth for declarative infrastructure and applications.\n\n## What is GitOps?\n\nGitOps uses Git repositories as the central point for declaring the desired state of your infrastructure. Changes are applied automatically when commits are pushed.\n\n## Setting Up GitHub Actions\n\n### Build and Push\nCreate a workflow that builds Docker images and pushes them to a container registry on every push to main.\n\n### Deploy to Kubernetes\nUse kubectl or Helm to deploy the new image to your Kubernetes cluster.\n\n## ArgoCD Integration\n\nFor a true GitOps workflow, integrate ArgoCD to sync your cluster state with your Git repository.\n\n## Best Practices\n\n- Use separate repos for app code and infrastructure\n- Implement branch protection rules\n- Use sealed secrets for sensitive data\n- Monitor deployments with alerts\n\n## Conclusion\n\nGitOps with GitHub Actions and Kubernetes provides a robust, auditable, and automated deployment pipeline.`,
      excerpt: 'Implement GitOps with GitHub Actions and Kubernetes for automated, auditable deployments.',
      status: 'PUBLISHED',
      seoTitle: 'GitOps with GitHub Actions and Kubernetes | ALANTEK Blog',
      seoDescription: 'Complete guide to implementing GitOps workflows with GitHub Actions and Kubernetes.',
      views: 198,
      authorId: admin?.id,
      categorySlugs: ['devops'],
      tagSlugs: ['docker', 'best-practices', 'nodejs'],
    },
  ];

  for (const p of posts) {
    const { categorySlugs, tagSlugs, ...data } = p;
    const post = await prisma.post.create({ data: { ...data, publishedAt: new Date() } });

    for (const cs of categorySlugs) {
      const cat = postCategories[cs];
      if (cat) {
        await prisma.postCategoryPost.create({ data: { postId: post.id, categoryId: cat.id } });
      }
    }

    for (const ts of tagSlugs) {
      const tag = postTags[ts];
      if (tag) {
        await prisma.postTagPost.create({ data: { postId: post.id, tagId: tag.id } });
      }
    }
  }
  log('posts', `${posts.length} posts creados`);
}

// ─── SETTINGS ───────────────────────────────────────────────────────────────

async function seedSettings() {
  const settings = [
    { key: 'siteName', value: JSON.stringify('ALANTEK'), description: 'Nombre del sitio' },
    { key: 'companyName', value: JSON.stringify('ALANTEK S.A.S.'), description: 'Nombre legal de la empresa' },
    { key: 'siteDescription', value: JSON.stringify('Desarrollo de software y consultoría tecnológica'), description: 'Descripción del sitio' },
    { key: 'foundedYear', value: JSON.stringify(2020), description: 'Año de fundación' },
    { key: 'contactEmail', value: JSON.stringify('contacto@alantek.co'), description: 'Email de contacto' },
    { key: 'contactPhone', value: JSON.stringify('+57 300 123 4567'), description: 'Teléfono de contacto' },
    { key: 'seoTitle', value: JSON.stringify('ALANTEK — Desarrollo de Software y Consultoría'), description: 'Título SEO por defecto' },
    { key: 'seoDescription', value: JSON.stringify('ALANTEK: soluciones de desarrollo Full Stack y transformación digital para empresas.'), description: 'Meta descripción por defecto' },
    { key: 'socialLinkedIn', value: JSON.stringify('https://linkedin.com/company/alantek'), description: 'LinkedIn URL' },
    { key: 'socialGitHub', value: JSON.stringify('https://github.com/alantek'), description: 'GitHub URL' },
  ];

  let count = 0;
  for (const s of settings) {
    const existing = await prisma.setting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await prisma.setting.create({ data: s });
      count++;
    }
  }
  log('settings', `${count} settings nuevos (${settings.length} total)`);
}

// ─── PAGE VIEWS (SAMPLE) ───────────────────────────────────────────────────

async function seedPageViews() {
  const existing = await prisma.pageView.findFirst();
  if (existing) {
    log('pageviews', 'Ya existen page views, omitiendo.');
    return;
  }

  const paths = ['/', '/portfolio', '/nosotros', '/servicios', '/contacto', '/blog'];
  for (const path of paths) {
    await prisma.pageView.create({ data: { path, count: Math.floor(Math.random() * 500) + 100 } });
  }
  log('pageviews', `${paths.length} page views creados`);
}

// ─── CONTACT MESSAGES (SAMPLE) ──────────────────────────────────────────────

async function seedContacts() {
  const existing = await prisma.contactMessage.findFirst();
  if (existing) {
    log('contacts', 'Ya existen mensajes, omitiendo.');
    return;
  }

  const contacts = [
    { name: 'Pedro Sánchez', email: 'pedro@techstart.com', subject: 'Consulta sobre desarrollo de plataforma', message: 'Hola, estoy interesado en desarrollar una plataforma e-commerce. ¿Podemos agendar una reunión?', status: 'NEW' },
    { name: 'Ana Martínez', email: 'ana@globalretail.com', subject: 'Proyecto de dashboard analytics', message: 'Necesitamos un dashboard para monitorear nuestras métricas de ventas en tiempo real.', status: 'CONTACTED' },
    { name: 'Roberto Díaz', email: 'roberto@startup.co', subject: 'Desarrollo de app móvil', message: 'Tengo una idea para una app de delivery y busco un equipo de desarrollo.', status: 'NEW' },
  ];

  for (const c of contacts) {
    await prisma.contactMessage.create({ data: c });
  }
  log('contacts', `${contacts.length} mensajes creados`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ALANTEK — Seed Completo de Base de Datos');
  console.log('═══════════════════════════════════════════════════');
  if (DRY_RUN) console.log('  *** MODO DRY-RUN (sin cambios) ***');
  if (RESET) console.log('  *** MODO RESET (borrando datos corporativos) ***');
  console.log('');

  if (RESET && !DRY_RUN) {
    log('reset', 'Borrando datos corporativos...');
    await prisma.postTagPost.deleteMany();
    await prisma.postCategoryPost.deleteMany();
    await prisma.postTag.deleteMany();
    await prisma.postCategory.deleteMany();
    await prisma.post.deleteMany();
    await prisma.seoMetadata.deleteMany();
    await prisma.testimonial.deleteMany();
    await prisma.client.deleteMany();
    await prisma.serviceTechnology.deleteMany();
    await prisma.serviceFeature.deleteMany();
    await prisma.service.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.projectCategory.deleteMany();
    await prisma.projectTechnology.deleteMany();
    await prisma.projectImage.deleteMany();
    await prisma.project.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.company.deleteMany();
    await prisma.pageView.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.contactMessage.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.setting.deleteMany();
    log('reset', 'Datos corporativos eliminados.');
  }

  if (DRY_RUN) {
    const tables = ['users', 'profiles', 'roles', 'permissions', 'companies', 'team_members', 'technologies', 'services', 'clients', 'testimonials', 'projects', 'posts', 'categories', 'settings', 'page_views', 'contact_messages'];
    for (const t of tables) {
      const count = await prisma[t].count();
      console.log(`  ${t}: ${count} registros`);
    }
    console.log('\nDry-run completado. No se realizaron cambios.');
    return;
  }

  const admin = await seedAdmin();
  await seedRbac();
  await seedCompany();
  await seedTechnologies();
  await seedTeamMembers();
  await seedCategories();
  await seedServices();
  await seedClients();
  await seedTestimonials();
  await seedProjects();
  await seedPosts();
  await seedSettings();
  await seedPageViews();
  await seedContacts();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Seed completado exitosamente');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Admin: ${process.env.SEED_ADMIN_EMAIL || 'admin@portfolio.com'}`);
  console.log(`  Password: (SEED_ADMIN_PASSWORD o Admin123!)`);
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
