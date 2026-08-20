function isAdmin(req) {
  return req.user?.roles?.some(r => r === 'ADMIN' || r === 'SUPER_ADMIN') || false;
}

function buildProfileWhere(req, baseWhere = {}) {
  const where = { ...baseWhere };
  if (isAdmin(req) && req.query.memberId) {
    where.memberId = req.query.memberId;
  } else {
    where.userId = req.user.id;
  }
  return where;
}

function canManage(req, entity) {
  if (!entity) return false;
  if (entity.userId === req.user.id) return true;
  if (isAdmin(req)) return true;
  return false;
}

function memberIdFromBody(req) {
  return isAdmin(req) ? req.body.memberId || null : undefined;
}

module.exports = { isAdmin, buildProfileWhere, canManage, memberIdFromBody };
