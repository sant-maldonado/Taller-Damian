const sql = require('../db');
const { authMiddleware } = require('../auth-helpers');

module.exports = authMiddleware(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const result = await sql`
      SELECT u.id, u.email, u.name, u.phone, u.avatar_url, u.created_at,
             r.name as role_name, r.description as role_description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${req.user.id}
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result[0];

    const permissions = await sql`
      SELECT p.name FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = (SELECT role_id FROM users WHERE id = ${req.user.id})
    `;

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role: user.role_name,
        role_description: user.role_description,
        permissions: permissions.map(p => p.name),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Error al obtener usuario' });
  }
});
