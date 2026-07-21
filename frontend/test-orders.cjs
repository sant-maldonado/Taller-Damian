const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    // 1. Total ordenes
    const total = (await sql`SELECT COUNT(*)::int as c FROM orders`)[0].c;
    console.log('1. Total ordenes:', total);

    // 2. Por status
    const byStatus = await sql`SELECT status, COUNT(*)::int as c FROM orders GROUP BY status ORDER BY status`;
    console.log('2. Por status:', byStatus.map(s => s.status + '=' + s.c).join(', '));

    // 3. Ordenes sin servicios
    const sinServicios = (await sql`SELECT count(*)::int as c FROM orders o LEFT JOIN order_services os ON os.order_id = o.id WHERE os.id IS NULL`)[0].c;
    console.log('3. Ordenes sin servicios:', sinServicios);

    // 4. Ordenes por vehiculo
    const porVehiculo = await sql`
      SELECT v.plate, v.brand, v.model, COUNT(o.id)::int as orders
      FROM vehicles v LEFT JOIN orders o ON o.vehicle_id = v.id
      GROUP BY v.id, v.plate, v.brand, v.model ORDER BY v.plate
    `;
    console.log('4. Ordenes por vehiculo:');
    porVehiculo.forEach(v => console.log('   ' + v.plate + ' ' + v.brand + ' ' + v.model + ': ' + v.orders + ' ordenes'));

    // 5. Servicios en ordenes
    const osCount = (await sql`SELECT COUNT(*)::int as c FROM order_services`)[0].c;
    console.log('5. Total servicios en ordenes:', osCount);

    // 6. Facturas
    const invCount = (await sql`SELECT COUNT(*)::int as c FROM invoices`)[0].c;
    console.log('6. Total facturas:', invCount);

    // 7. Horas
    const htCount = (await sql`SELECT COUNT(*)::int as c FROM hours_tracking`)[0].c;
    console.log('7. Total registros horas:', htCount);

    // 8. Crear orden de test
    const vid = 'ce69669b-7e8e-47e6-91fd-ccabce0f6ad2';
    const testOrder = await sql`
      INSERT INTO orders (vehicle_id, status, description, mileage, notes, created_by)
      VALUES (${vid}, 'COMPLETED', 'Orden de test - cambio de aceite y filtro', 45000, 'Test generado por script', '245a3acb-6b00-47cc-94d6-1de6ca5e6e0e')
      RETURNING id
    `;
    const oid = testOrder[0].id;
    console.log('8. Orden de test creada:', oid);

    await sql`INSERT INTO order_services (order_id, name, price) VALUES (${oid}, 'Cambio de aceite', 6000), (${oid}, 'Filtro de aire', 3500)`;
    await sql`INSERT INTO invoices (order_id, total, created_by) VALUES (${oid}, 9500, '245a3acb-6b00-47cc-94d6-1de6ca5e6e0e')`;
    await sql`INSERT INTO hours_tracking (user_id, order_id, description, hours, date) VALUES ('245a3acb-6b00-47cc-94d6-1de6ca5e6e0e', ${oid}, 'Test', 1.5, CURRENT_DATE)`;

    // 9. Verificar historial ABC123
    const history = await sql`
      SELECT o.id, o.status, o.mileage, o.description,
        (SELECT coalesce(json_agg(jsonb_build_object('name', os.name, 'price', os.price)) FILTER (WHERE os.id IS NOT NULL), '[]'::json) FROM order_services os WHERE os.order_id = o.id) as services,
        (SELECT coalesce(json_agg(jsonb_build_object('invoice_number', i.invoice_number, 'total', i.total)) FILTER (WHERE i.id IS NOT NULL), '[]'::json) FROM invoices i WHERE i.order_id = o.id) as invoices,
        (SELECT coalesce(sum(ht.hours), 0) FROM hours_tracking ht WHERE ht.order_id = o.id) as total_hours
      FROM orders o
      WHERE o.vehicle_id = ${vid}
      ORDER BY o.created_at DESC
    `;
    console.log('9. Historial ABC123 (' + history.length + ' ordenes, test incluida):');
    history.forEach((o, i) => {
      const svc = o.services ? o.services.map(s => s.name).join(', ') : '—';
      const inv = o.invoices && o.invoices.length > 0 ? '$' + o.invoices[0].total : '—';
      const esTest = o.description && o.description.includes('test') ? ' [TEST]' : '';
      console.log('   ' + (i+1) + '. ' + o.status + ' | ' + (o.mileage || '—') + 'km | ' + inv + ' | ' + o.total_hours + 'h | ' + svc.substring(0, 60) + esTest);
    });

    // 10. Limpiar test
    await sql`DELETE FROM hours_tracking WHERE order_id = ${oid}`;
    await sql`DELETE FROM order_services WHERE order_id = ${oid}`;
    await sql`DELETE FROM invoices WHERE order_id = ${oid}`;
    await sql`DELETE FROM orders WHERE id = ${oid}`;
    console.log('10. Orden de test eliminada correctamente');

    // 11. Test login DNI
    const loginTest = await sql`
      SELECT u.name, u.email, r.name as role, c.dni, c.id as client_id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN clients c ON c.email = u.email
      WHERE u.email = 'cliente1@email.com'
    `;
    console.log('11. Login client test:', loginTest[0] ? loginTest[0].name + ' | DNI: ' + loginTest[0].dni + ' | Role: ' + loginTest[0].role : 'NO ENCONTRADO');

    console.log('\n✅ Todos los tests pasaron');
  } catch(e) { console.error('Error:', e.message); }
}
test();
