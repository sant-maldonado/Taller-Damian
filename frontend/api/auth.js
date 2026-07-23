const sql = require('./db');
const bcrypt = require('bcryptjs');
const { generateToken, authMiddleware } = require('./auth-helpers');

module.exports = async (req, res) => {
  const { action } = req.query;

  if (action === 'login') return handleLogin(req, res);
  if (action === 'register') return handleRegister(req, res);
  if (action === 'me') return handleMe(req, res);
  if (action === 'change-password') return handleChangePassword(req, res);

  return res.status(400).json({ error: 'Acción no válida' });
};

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { identifier, email, password } = req.body;
    const loginId = identifier || email;
    if (!loginId || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });

    let result;

    if (loginId.includes('@')) {
      result = await sql`
        SELECT u.*, r.name as role_name FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.email = ${loginId} AND u.is_active = true
      `;
    } else {
      const cleaned = loginId.toUpperCase().trim();

      const byPlate = await sql`
        SELECT u.*, r.name as role_name FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN clients c ON c.email = u.email
        JOIN vehicles v ON v.client_id = c.id
        WHERE UPPER(REPLACE(v.plate, ' ', '')) = ${cleaned.replace(/\s/g, '')}
        AND u.is_active = true
        LIMIT 1
      `;

      if (byPlate.length > 0) {
        result = byPlate;
      } else {
        result = await sql`
          SELECT u.*, r.name as role_name FROM users u
          JOIN roles r ON u.role_id = r.id
          JOIN clients c ON c.email = u.email
          WHERE c.dni = ${loginId}
          AND u.is_active = true
        `;
      }
    }

    if (result.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = result[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales incorrectas' });

    await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

async function handleRegister(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { email, password, name, phone, dni, plate, brand, model, year } = req.body;
    if (!email || !password || !name || !dni || !plate) {
      return res.status(400).json({ error: 'Nombre, email, contraseña, DNI y patente son requeridos' });
    }

    const existingEmail = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existingEmail.length > 0) return res.status(409).json({ error: 'El email ya está registrado' });

    const existingDni = await sql`SELECT id FROM clients WHERE dni = ${dni}`;
    if (existingDni.length > 0) return res.status(409).json({ error: 'El DNI ya está registrado' });

    const existingPlate = await sql`SELECT id FROM vehicles WHERE UPPER(REPLACE(plate, ' ', '')) = ${plate.toUpperCase().replace(/\s/g, '')}`;
    if (existingPlate.length > 0) return res.status(409).json({ error: 'La patente ya está registrada' });

    const passwordHash = await bcrypt.hash(password, 10);
    const roleResult = await sql`SELECT id FROM roles WHERE name = 'client'`;
    const roleId = roleResult.length > 0 ? roleResult[0].id : null;

    const userResult = await sql`
      INSERT INTO users (email, password_hash, name, phone, role_id)
      VALUES (${email}, ${passwordHash}, ${name}, ${phone || null}, ${roleId})
      RETURNING id, email, name, phone, created_at
    `;

    const user = userResult[0];

    const clientResult = await sql`
      INSERT INTO clients (name, phone, email, dni, created_by)
      VALUES (${name}, ${phone || null}, ${email}, ${dni}, ${user.id})
      RETURNING id
    `;

    const clientId = clientResult[0].id;

    await sql`
      INSERT INTO vehicles (plate, brand, model, year, client_id, created_by)
      VALUES (${plate.toUpperCase()}, ${brand || null}, ${model || null}, ${year ? parseInt(year) : null}, ${clientId}, ${user.id})
    `;

    const token = generateToken({ ...user, role_name: 'client' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: 'client',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

const handleMe = authMiddleware(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const result = await sql`
      SELECT u.id, u.email, u.name, u.phone, u.avatar_url, u.created_at,
             r.name as role_name, r.description as role_description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${req.user.id}
    `;

    if (result.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

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

const handleChangePassword = authMiddleware(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const result = await sql`SELECT password_hash FROM users WHERE id = ${req.user.id}`;
    if (result.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(current_password, result[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const newHash = await bcrypt.hash(new_password, 10);
    await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${req.user.id}`;

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});
