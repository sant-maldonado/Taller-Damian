const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);

async function t() {
  // Simular la query exacta del backend
  const query = `SELECT o.status, v.plate, v.brand, v.model FROM orders o JOIN vehicles v ON v.id = o.vehicle_id WHERE o.status = $1 ORDER BY o.created_at DESC`;
  const params = ['COMPLETED'];
  const r = await sql.query(query, params);
  console.log('COMPLETED:', r.length);
  r.forEach(o => console.log('  ' + o.status + ' | ' + o.plate));

  const params2 = ['IN_PROGRESS'];
  const r2 = await sql.query(query, params2);
  console.log('IN_PROGRESS:', r2.length);
  r2.forEach(o => console.log('  ' + o.status + ' | ' + o.plate));

  // Que status existen en la DB?
  const all = await sql.query('SELECT DISTINCT status FROM orders ORDER BY status');
  console.log('Status en DB:', all.map(s => s.status));
}
t().catch(e => console.error(e.message));
