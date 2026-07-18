const sql = require('../db');
const { authMiddleware } = require('../auth-helpers');

module.exports = authMiddleware(async (req, res) => {
  if (req.method === 'GET') {
    try {
      const roles = await sql`
        SELECT r.*,
          (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as user_count
        FROM roles r
        ORDER BY r.name
      `;

      const rolesWithPerms = await Promise.all(
        roles.map(async (role) => {
          const permissions = await sql`
            SELECT p.name, p.description, p.module, p.action
            FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            WHERE rp.role_id = ${role.id}
            ORDER BY p.module, p.action
          `;
          return { ...role, permissions };
        })
      );

      return res.status(200).json(rolesWithPerms);
    } catch (error) {
      console.error('Get roles error:', error);
      return res.status(500).json({ error: 'Error al obtener roles' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
});
