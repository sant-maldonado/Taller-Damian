const sql = require('../db');
const { requirePermission } = require('../auth-helpers');

module.exports = requirePermission('users.read')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const users = await sql`
      SELECT u.id, u.email, u.name, u.phone, u.is_active, u.last_login, u.created_at,
             r.name as role_name, r.description as role_description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;

    return res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});
