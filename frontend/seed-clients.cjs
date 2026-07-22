const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  try {
    // Crear rol client
    await sql`INSERT INTO roles (name, description) 
      VALUES ('client', 'Cliente - acceso limitado a sus propios datos') 
      ON CONFLICT (name) DO NOTHING`;

    // Asignar permisos: solo lectura de sus propios vehículos y órdenes
    await sql`INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.name = 'client' AND p.name IN ('vehicles.read', 'orders.read')
      ON CONFLICT DO NOTHING`;

    // Crear 5 clientes como usuarios
    const clientes = [
      { email: '30123456', name: 'Martín López', phone: '+54 11 6666-0001', dni: '30123456' },
      { email: '30234567', name: 'Lucía García', phone: '+54 11 6666-0002', dni: '30234567' },
      { email: '30345678', name: 'Fernando Ruiz', phone: '+54 11 6666-0003', dni: '30345678' },
      { email: '30456789', name: 'Camila Torres', phone: '+54 11 6666-0004', dni: '30456789' },
      { email: '30567890', name: 'Rodrigo Díaz', phone: '+54 11 6666-0005', dni: '30567890' }
    ];

    for (const c of clientes) {
      // Crear usuario
      await sql`INSERT INTO users (email, password_hash, name, role_id, phone, is_active)
        SELECT ${c.email}, crypt('admin123', gen_salt('bf')), ${c.name}, r.id, ${c.phone}, true
        FROM roles r WHERE r.name = 'client'
        ON CONFLICT (email) DO NOTHING`;

      // Crear registro en tabla clients
      const userId = await sql`SELECT id FROM users WHERE email = ${c.email}`;
      if (userId.length > 0) {
        await sql`INSERT INTO clients (name, phone, email, dni, created_by)
          VALUES (${c.name}, ${c.phone}, ${c.email}, ${c.dni}, ${userId[0].id})
          ON CONFLICT (dni) DO NOTHING`;
      }
    }

    // Verificar
    const users = await sql`SELECT u.name, u.email, r.name as role, u.is_active
      FROM users u JOIN roles r ON r.id = u.role_id ORDER BY r.name, u.name`;

    console.log('Todos los usuarios:');
    users.forEach(u => console.log(`  ${u.role.padEnd(10)} | ${u.email.padEnd(25)} | ${u.name}`));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

seed();
