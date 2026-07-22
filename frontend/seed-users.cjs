const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  try {
    // Solo el admin principal
    await sql`INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
      SELECT 'admin@taller.com', crypt('admin123', gen_salt('bf')), 'Administrador', r.id, '+54 11 5555-0001', true
      FROM roles r WHERE r.name = 'admin' ON CONFLICT (email) DO NOTHING`;

    const users = await sql`SELECT u.name, u.email, r.name as role, u.is_active
      FROM users u JOIN roles r ON r.id = u.role_id ORDER BY r.name, u.name`;

    console.log('Usuarios:');
    users.forEach(u => console.log(`  ${u.role.padEnd(10)} | ${u.email.padEnd(25)} | ${u.name}`));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

seed();
