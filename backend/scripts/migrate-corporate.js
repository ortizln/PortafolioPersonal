const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getSettingsMap() {
  const settings = await prisma.setting.findMany();
  const map = {};
  for (const s of settings) {
    let val = s.value;
    if (typeof val === 'string') {
      try { val = JSON.parse(val); } catch { /* keep as string */ }
    }
    map[s.key] = val;
  }
  return map;
}

async function migrateCompany(settings, profiles) {
  const existing = await prisma.company.findFirst();
  if (existing) {
    console.log('[company] ya existe, omitido.');
    return existing;
  }

  const profile = profiles[0];
  const name =
    (typeof settings.companyName === 'string' && settings.companyName.trim()) ||
    (typeof settings.siteName === 'string' && settings.siteName.trim()) ||
    'ALANTEK';

  const company = await prisma.company.create({
    data: {
      name,
      slug: slugify(name) || 'alantek',
      email: profile?.email || null,
      phone: profile?.phone || null,
      website: profile?.website || null,
      description: profile?.biography || profile?.aboutMe || profile?.description || null,
      heroImageUrl: profile?.bannerImage || null,
      logoUrl: profile?.profileImage || null,
      foundedYear: settings.foundedYear ? Number(settings.foundedYear) : null,
      isActive: true
    }
  });
  console.log(`[company] creada: ${company.name}`);
  return company;
}

async function migrateMember(profiles) {
  const existing = await prisma.teamMember.findFirst({ where: { deletedAt: null } });
  if (existing) {
    console.log(`[team] ya existe: ${existing.fullName} (${existing.id})`);
    return existing;
  }

  const profile = profiles[0];
  if (!profile) {
    console.log('[team] no hay perfil para crear un miembro inicial.');
    return null;
  }

  const member = await prisma.teamMember.create({
    data: {
      slug: slugify(profile.fullName) || 'miembro',
      fullName: profile.fullName,
      professionalTitle: profile.professionalTitle || 'Miembro del equipo',
      email: profile.email || null,
      phone: profile.phone || null,
      location: profile.location || null,
      bio: profile.description || null,
      about: profile.aboutMe || profile.biography || null,
      photoUrl: profile.profileImage || null,
      linkedinUrl: profile.linkedinUrl || null,
      githubUrl: profile.githubUrl || null,
      twitterUrl: profile.twitterUrl || null,
      isFounder: true,
      isActive: true,
      isPublic: true
    }
  });
  console.log(`[team] miembro creado: ${member.fullName} (${member.id})`);
  return member;
}

async function attachProfileData(member, profiles) {
  if (!member) return;

  const userIds = profiles.map((p) => p.userId);

  const targets = [
    { model: 'experience', key: 'experiences' },
    { model: 'education', key: 'educations' },
    { model: 'certification', key: 'certifications' },
    { model: 'skill', key: 'skills' },
    { model: 'language', key: 'languages' },
    { model: 'socialLink', key: 'socialLinks' }
  ];

  for (const { model, key } of targets) {
    const updated = await prisma[model].updateMany({
      where: { memberId: null, userId: { in: userIds }, deletedAt: null },
      data: { memberId: member.id }
    });
    console.log(`[attach] ${key}: ${updated.count} registros vinculados al miembro`);
  }
}

async function main() {
  const profiles = await prisma.profile.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' }
  });
  const settings = await getSettingsMap();

  console.log(`Perfiles activos encontrados: ${profiles.length}`);

  await migrateCompany(settings, profiles);
  const member = await migrateMember(profiles);
  await attachProfileData(member, profiles);

  console.log('Migración a modelo corporativo completada.');
}

main()
  .catch((e) => {
    console.error('Error en la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
