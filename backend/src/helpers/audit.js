const prisma = require('../config/database');

const audit = async ({ userId = null, action, entity, entityId = null, description = null, metadata = null, req = null }) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        description,
        metadata,
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        userId
      }
    });
  } catch (error) {
    // nunca romper el flujo principal por un error de auditoría
  }
};

const auditAsync = (action, entity, { entityId = null, description = null, metadata = null } = {}) => {
  return async (req, res, next) => {
    await audit({ userId: req.user?.id, action, entity, entityId, description, metadata, req });
    next();
  };
};

module.exports = { audit, auditAsync };
