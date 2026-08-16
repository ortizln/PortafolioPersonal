-- Renombrar el enum heredado "Role" a "LegacyRole" para alinear con schema.prisma
ALTER TYPE "Role" RENAME TO "LegacyRole";
