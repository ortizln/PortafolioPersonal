const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@portfolio.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

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

  console.log('Seed completed successfully!');
  console.log(`Admin user: ${adminEmail}`);
  console.log('Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
