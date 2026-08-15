const { verifyAccessToken } = require('../auth/jwt');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        isActive: true,
        rbacRole: {
          select: {
            id: true,
            name: true,
            permissions: { select: { permission: { select: { name: true } } } }
          }
        },
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: { select: { permission: { select: { name: true } } } }
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user.' });
    }

    const roles = [];
    const permissions = new Set();

    if (user.rbacRole) {
      roles.push(user.rbacRole.name);
      user.rbacRole.permissions.forEach((rp) => permissions.add(rp.permission.name));
    }
    user.userRoles.forEach((ur) => {
      roles.push(ur.role.name);
      ur.role.permissions.forEach((rp) => permissions.add(rp.permission.name));
    });

    if (roles.length === 0) {
      roles.push(user.role === 'ADMIN' ? 'SUPER_ADMIN' : 'VIEWER');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleId: user.roleId,
      isActive: user.isActive,
      roles,
      permissions: Array.from(permissions)
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const hasRole = (...roles) => {
  const allowed = new Set(roles);
  return (req, res, next) => {
    if (!req.user.roles.some((r) => allowed.has(r))) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

const requirePermission = (...permissions) => {
  return (req, res, next) => {
    const required = new Set(permissions);
    const granted = new Set(req.user.permissions);
    if (!req.user.roles.includes('SUPER_ADMIN') && !permissions.some((p) => granted.has(p))) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

const authorize = (...roles) => {
  const legacy = new Set(roles);
  return (req, res, next) => {
    if (!legacy.has(req.user.role) && !req.user.roles.some((r) => legacy.has(r))) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, hasRole, requirePermission };
