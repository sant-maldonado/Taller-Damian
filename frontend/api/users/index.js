const sql = require('../db');
const bcrypt = require('bcryptjs');
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

const handleCreateUser = requirePermission('users.create')(async (req, res) => {
  try {
    const { email, password, name, phone, role_name } = req.body;
    if (!email || !password || !name || !role_name) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y rol son requeridos' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const roleResult = await sql`SELECT id FROM roles WHERE name = ${role_name}`;
    if (roleResult.length === 0) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const roleId = roleResult[0].id;

    const result = await sql`
      INSERT INTO users (email, password_hash, name, phone, role_id)
      VALUES (${email}, ${passwordHash}, ${name}, ${phone || null}, ${roleId})
      RETURNING id, email, name, phone, is_active, created_at
    `;

    const user = result[0];

    if (role_name === 'client') {
      await sql`INSERT INTO clients (name, phone, email, dni, created_by) VALUES (${name}, ${phone || null}, ${email}, '', ${req.user.id})`;
    }

    return res.status(201).json({ ...user, role_name });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Error al crear usuario' });
  }
});

const handleUpdateUser = requirePermission('users.update')(async (req, res) => {
  try {
    const { id, name, phone, role_name, is_active } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    if (role_name) {
      const roleResult = await sql`SELECT id FROM roles WHERE name = ${role_name}`;
      if (roleResult.length === 0) {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      const result = await sql`
        UPDATE users
        SET name = ${name}, phone = ${phone || null}, role_id = ${roleResult[0].id}, is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, email, name, phone, is_active, created_at
      `;

      if (result.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.status(200).json({ ...result[0], role_name });
    }

    const result = await sql`
      UPDATE users
      SET name = ${name}, phone = ${phone || null}, is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, name, phone, is_active, created_at
    `;

    if (result.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const roleRes = await sql`SELECT r.name FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = ${id}`;
    return res.status(200).json({ ...result[0], role_name: roleRes[0]?.name });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

const handleDeactivateUser = requirePermission('users.delete')(async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No podés desactivar tu propia cuenta' });
    }

    const result = await sql`
      UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ${id} RETURNING id
    `;

    if (result.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(200).json({ message: 'Usuario desactivado' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({ error: 'Error al desactivar usuario' });
  }
});

module.exports = async (req, res) => {
  const { action } = req.query;

  if (action === 'list-roles') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
    return handleListRoles(req, res);
  }

  switch (req.method) {
    case 'GET': return handleListUsers(req, res);
    case 'POST': return handleCreateUser(req, res);
    case 'PUT': return handleUpdateUser(req, res);
    case 'DELETE': return handleDeactivateUser(req, res);
    default: return res.status(405).json({ error: 'Método no permitido' });
  }
};
