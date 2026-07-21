const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'taller-mecanico-secret-key-change-in-production';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authMiddleware(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      req.user = decoded;

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}

function requirePermission(permission) {
  return (handler) => {
    return authMiddleware(async (req, res) => {
      const sql = require('./db');

      const result = await sql`
        SELECT p.name FROM permissions p
        JOIN role_permissions rp ON rp.permission_id = p.id
        JOIN users u ON u.role_id = rp.role_id
        WHERE u.id = ${req.user.id} AND p.name = ${permission}
      `;

      if (result.length === 0) {
        return res.status(403).json({ error: 'Sin permisos para esta acción' });
      }

      return handler(req, res);
    });
  };
}

async function getClientIdForUser(userId) {
  const sql = require('./db');
  const result = await sql`
    SELECT c.id FROM clients c
    JOIN users u ON u.email = c.email
    WHERE u.id = ${userId}
  `;
  return result.length > 0 ? result[0].id : null;
}

module.exports = { generateToken, verifyToken, authMiddleware, requirePermission, JWT_SECRET, getClientIdForUser };
