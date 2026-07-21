require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('Conexión OK:', result);

    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('Tablas:', tables.map(t => t.table_name).join(', '));

    const roles = await sql`SELECT name FROM roles`;
    console.log('Roles:', roles.map(r => r.name).join(', '));

    const users = await sql`SELECT email, name FROM users`;
    console.log('Usuarios:', users.map(u => `${u.email} (${u.name})`).join(', '));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
