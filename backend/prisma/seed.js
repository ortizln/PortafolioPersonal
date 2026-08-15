const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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
  { name: 'notifications.read', module: 'system', description: 'Ver notificaciones' }
];

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Acceso total al sistema', permissions: PERMISSIONS.map((p) => p.name) },
  { name: 'ADMIN', description: 'Administra contenido y operación del sitio', permissions: PERMISSIONS.filter((p) => !['users.manage', 'roles.manage', 'settings.manage', 'audit.read'].includes(p.name)).map((p) => p.name) },
  { name: 'CONTENT_MANAGER', description: 'Gestiona contenido corporativo y del blog', permissions: ['company.read', 'company.update', 'team.read', 'team.update', 'services.manage', 'clients.manage', 'testimonials.manage', 'categories.manage', 'technologies.manage', 'posts.manage', 'posts.publish', 'media.upload', 'media.manage', 'projects.read', 'projects.update', 'messages.read'] },
  { name: 'PROJECT_MANAGER', description: 'Gestiona proyectos y portafolio', permissions: ['projects.read', 'projects.create', 'projects.update', 'projects.delete', 'projects.publish', 'categories.manage', 'technologies.manage', 'media.upload', 'team.read', 'messages.read'] },
  { name: 'TEAM_MEMBER', description: 'Colaborador del equipo', permissions: ['projects.read', 'team.read', 'company.read', 'messages.read', 'media.upload'] },
  { name: 'VIEWER', description: 'Solo lectura', permissions: ['company.read', 'team.read', 'projects.read', 'messages.read'] }
];

async function seedRbac() {
  const permissionMap = {};
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: { module: p.module, description: p.description },
      create: { name: p.name, module: p.module, description: p.description }
    });
    permissionMap[p.name] = perm.id;
  }

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isSystem: true },
      create: { name: r.name, description: r.description, isSystem: true }
    });
    const current = await prisma.rolePermission.findMany({ where: { roleId: role.id }, select: { permissionId: true } });
    const currentIds = new Set(current.map((c) => c.permissionId));
    for (const permName of r.permissions) {
      const permId = permissionMap[permName];
      if (permId && !currentIds.has(permId)) {
        await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permId } });
      }
    }
  }
}

async function assignAdminRole() {
  const admin = await prisma.user.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } });
  if (!admin) return;
  const role = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  if (!role) return;
  const existing = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId: admin.id, roleId: role.id } }
  });
  if (!existing) {
    await prisma.userRole.create({ data: { userId: admin.id, roleId: role.id } });
    await prisma.user.update({ where: { id: admin.id }, data: { roleId: role.id } });
    console.log(`Assigned SUPER_ADMIN to ${admin.email}`);
  }
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@portfolio.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    await seedRbac();
    await assignAdminRole();
    console.log('RBAC roles seeded.');
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
      profile: {
        create: {
          fullName: 'Tu Nombre Profesional',
          professionalTitle: 'Full Stack Developer',
          description: 'Descripción profesional corta',
          biography: 'Biografía completa aquí...',
          aboutMe: 'Sobre mí...',
          professionalStory: 'Mi historia profesional...',
          objectives: 'Mis objetivos...',
          workPhilosophy: 'Mi filosofía de trabajo...',
          specialties: 'Especialidades...',
          quickStats: JSON.stringify({
            projects: 0,
            experience: 0,
            certifications: 0,
            technologies: 0
          })
        }
      }
    }
  });

  const technologies = [
    { name: 'Angular', category: 'FRONTEND', color: '#DD0031', icon: 'angular' },
    { name: 'React', category: 'FRONTEND', color: '#61DAFB', icon: 'react' },
    { name: 'Vue.js', category: 'FRONTEND', color: '#4FC08D', icon: 'vuejs' },
    { name: 'Node.js', category: 'BACKEND', color: '#339933', icon: 'nodejs' },
    { name: 'Express', category: 'BACKEND', color: '#000000', icon: 'express' },
    { name: 'TypeScript', category: 'FRONTEND', color: '#3178C6', icon: 'typescript' },
    { name: 'JavaScript', category: 'FRONTEND', color: '#F7DF1E', icon: 'javascript' },
    { name: 'PostgreSQL', category: 'DATABASE', color: '#4169E1', icon: 'postgresql' },
    { name: 'MongoDB', category: 'DATABASE', color: '#47A248', icon: 'mongodb' },
    { name: 'Docker', category: 'DEVOPS', color: '#2496ED', icon: 'docker' },
    { name: 'AWS', category: 'CLOUD', color: '#FF9900', icon: 'aws' },
    { name: 'Python', category: 'BACKEND', color: '#3776AB', icon: 'python' },
    { name: 'Git', category: 'DEVOPS', color: '#F05032', icon: 'git' },
    { name: 'Bootstrap', category: 'FRONTEND', color: '#7952B3', icon: 'bootstrap' },
    { name: 'Sass', category: 'FRONTEND', color: '#CC6699', icon: 'sass' }
  ];

  for (const tech of technologies) {
    await prisma.technology.create({ data: tech });
  }

  const skills = [
    { name: 'Angular', percentage: 90, level: 'Avanzado', category: 'FRONTEND' },
    { name: 'React', percentage: 85, level: 'Avanzado', category: 'FRONTEND' },
    { name: 'Node.js', percentage: 88, level: 'Avanzado', category: 'BACKEND' },
    { name: 'TypeScript', percentage: 92, level: 'Experto', category: 'FRONTEND' },
    { name: 'PostgreSQL', percentage: 80, level: 'Avanzado', category: 'DATABASE' },
    { name: 'Docker', percentage: 75, level: 'Intermedio', category: 'DEVOPS' },
    { name: 'AWS', percentage: 70, level: 'Intermedio', category: 'CLOUD' },
    { name: 'Python', percentage: 78, level: 'Intermedio', category: 'BACKEND' },
    { name: 'UI/UX Design', percentage: 72, level: 'Intermedio', category: 'DESIGN' },
    { name: 'Flutter', percentage: 65, level: 'Intermedio', category: 'MOBILE' }
  ];

  for (const skill of skills) {
    await prisma.skill.create({
      data: { ...skill, userId: user.id }
    });
  }

  const languages = [
    { name: 'Español', level: 'Nativo', percentage: 100 },
    { name: 'Inglés', level: 'Avanzado', percentage: 85 },
    { name: 'Portugués', level: 'Intermedio', percentage: 50 }
  ];

  for (const lang of languages) {
    await prisma.language.create({
      data: { ...lang, userId: user.id }
    });
  }

  const socialLinks = [
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/username', icon: 'linkedin', order: 1 },
    { platform: 'GitHub', url: 'https://github.com/username', icon: 'github', order: 2 },
    { platform: 'Twitter', url: 'https://twitter.com/username', icon: 'twitter', order: 3 }
  ];

  for (const link of socialLinks) {
    await prisma.socialLink.create({
      data: { ...link, userId: user.id }
    });
  }

  await seedRbac();
  await assignAdminRole();

  console.log('Seed completed successfully!');
  console.log(`Admin user: ${adminEmail}`);
  console.log('Password: (definida por SEED_ADMIN_PASSWORD)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
