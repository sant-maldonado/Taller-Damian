const sql = require('../db');
const { requirePermission, authMiddleware } = require('../auth-helpers');

const handleListRoles = authMiddleware(async (req, res) => {
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
});

const handleListUsers = requirePermission('users.read')(async (req, res) => {
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

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { action } = req.query;

  if (action === 'list-roles') {
    return handleListRoles(req, res);
  }

  return handleListUsers(req, res);
};
