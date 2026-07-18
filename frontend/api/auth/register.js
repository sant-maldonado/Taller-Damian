const sql = require('../db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../auth-helpers');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, password, name, phone, role_name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const roleResult = await sql`SELECT id FROM roles WHERE name = ${role_name || 'viewer'}`;
    const roleId = roleResult.length > 0 ? roleResult[0].id : null;

    const result = await sql`
      INSERT INTO users (email, password_hash, name, phone, role_id)
      VALUES (${email}, ${passwordHash}, ${name}, ${phone || null}, ${roleId})
      RETURNING id, email, name, phone, created_at
    `;

    const user = result[0];
    const token = generateToken({ ...user, role_name: role_name || 'viewer' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: role_name || 'viewer',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};
