const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

const ADMIN_ID = '245a3acb-6b00-47cc-94d6-1de6ca5e6e0e';

const vehicles = {
  ABC123: 'ce69669b-7e8e-47e6-91fd-ccabce0f6ad2',
  DEF456: '6b1fb034-4242-405c-908d-060075a4e89a',
  GHI789: 'cc4ef579-fefa-4b33-9d1e-7bc82a04a3e1',
  JKL012: 'a41759b5-28b5-4080-b709-b72aaa6af066',
};

function daysAgo(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  return dt.toISOString();
}

async function insertOrder(plate, status, description, mileage, days, notes, services, hours, invoiceTotal) {
  const vid = vehicles[plate];
  const orderResult = await sql`INSERT INTO orders (vehicle_id, status, description, mileage, notes, assigned_to, created_by, created_at, updated_at)
    VALUES (${vid}, ${status}, ${description}, ${mileage}, ${notes}, ${ADMIN_ID}, ${ADMIN_ID}, ${daysAgo(days)}, ${daysAgo(Math.max(days - 2, 0))})
    RETURNING id`;

  const oid = orderResult[0].id;

  for (const svc of services) {
    await sql`INSERT INTO order_services (order_id, name, price, notes)
      VALUES (${oid}, ${svc.name}, ${svc.price}, ${svc.notes || null})`;
  }

  if (hours && hours.length > 0) {
    for (const h of hours) {
      await sql`INSERT INTO hours_tracking (user_id, order_id, description, hours, date)
        VALUES (${ADMIN_ID}, ${oid}, ${h.desc}, ${h.h}, ${daysAgo(days).split('T')[0]})`;
    }
  }

  if (invoiceTotal) {
    await sql`INSERT INTO invoices (order_id, total, created_by, created_at)
      VALUES (${oid}, ${invoiceTotal}, ${ADMIN_ID}, ${daysAgo(Math.max(days - 1, 0))})`;
  }

  return oid;
}

async function seed() {
  try {
    console.log('Limpiando datos seed anteriores...');
    const originalOrders = [
      'cab72b4d-a8b1-4dcb-9550-ee15db01c44c',
      '33226465-255b-4e3e-ba63-9af1ef52b91c',
      '93a519a6-ce0b-4833-9a92-721325d95349',
      'ab880070-9e80-46b3-b45d-f9b91ee288d4',
    ];

    await sql`DELETE FROM hours_tracking WHERE order_id NOT IN (${originalOrders[0]}, ${originalOrders[1]}, ${originalOrders[2]}, ${originalOrders[3]})`;
    await sql`DELETE FROM order_services WHERE order_id NOT IN (${originalOrders[0]}, ${originalOrders[1]}, ${originalOrders[2]}, ${originalOrders[3]})`;
    await sql`DELETE FROM invoices WHERE order_id NOT IN (${originalOrders[0]}, ${originalOrders[1]}, ${originalOrders[2]}, ${originalOrders[3]})`;
    await sql`DELETE FROM orders WHERE id NOT IN (${originalOrders[0]}, ${originalOrders[1]}, ${originalOrders[2]}, ${originalOrders[3]})`;

    await sql`SELECT setval(pg_get_serial_sequence('invoices', 'invoice_number'), (SELECT COALESCE(MAX(invoice_number), 1004) FROM invoices))`;

    console.log('Insertando ordenes de ejemplo...');

    // === ABC123 Toyota Corolla ===
    await insertOrder('ABC123', 'COMPLETED', 'Service 10.000 km — aceite, filtro, fluideces',
      10000, 180, 'Primer service programado. Cliente satisfecho.',
      [{ name: 'Cambio de aceite', price: 5500, notes: 'Sintetico 5W30' }, { name: 'Revisión general', price: 8000 }],
      [{ desc: 'Service 10k — aceite y revisión', h: 2 }], 13500);

    await insertOrder('ABC123', 'COMPLETED', 'Service 20.000 km — aceite, filtro, frenos delanteros',
      20000, 130, 'Pastillas delanteras al 40%. Se recomienda revisar traseros en el próximo service.',
      [{ name: 'Cambio de aceite', price: 5500 }, { name: 'Cambio de frenos', price: 16000 }, { name: 'Revisión general', price: 8000 }],
      [{ desc: 'Service 20k — aceite y frenos', h: 3.5 }], 29500);

    await insertOrder('ABC123', 'COMPLETED', 'Service 30.000 km — aceite, filtro, alineación, balanceo',
      30000, 75, 'Neumáticos con buen desgaste. Alineación dentro de parámetros.',
      [{ name: 'Cambio de aceite', price: 6000 }, { name: 'Alineación y balanceo', price: 9000 }],
      [{ desc: 'Service 30k — aceite, alineación y balanceo', h: 2.5 }], 15000);

    await insertOrder('ABC123', 'COMPLETED', 'Service 40.000 km — aceite, filtro, distribución preventiva',
      40000, 30, 'Correa de distribución con 38k km. Se reemplaza preventivamente.',
      [{ name: 'Cambio de aceite', price: 6500 }, { name: 'Cambio de distribución', price: 28000 }, { name: 'Revisión general', price: 10000 }],
      [{ desc: 'Desarme y reemplazo de distribución', h: 5 }, { desc: 'Armado y prueba de motor', h: 2 }], 44500);

    // === DEF456 Honda Civic ===
    await insertOrder('DEF456', 'COMPLETED', 'Service 15.000 km — aceite, filtro, limpieza de inyectores',
      15000, 150, 'Inyectores limpiados. Motor funciona normal.',
      [{ name: 'Cambio de aceite', price: 6000 }, { name: 'Revisión general', price: 8000 }],
      [{ desc: 'Service 15k Civic — limpieza de inyectores', h: 2.5 }], 14000);

    await insertOrder('DEF456', 'COMPLETED', 'Reparación de aire acondicionado — no enfría',
      22000, 90, 'Fuga en condensor. Se reparó y recargó gas.',
      [{ name: 'Servicio de aire acondicionado', price: 15000 }],
      [{ desc: 'Diagnóstico de A/C', h: 1 }, { desc: 'Reparación de condensor y recarga', h: 2 }], 15000);

    await insertOrder('DEF456', 'COMPLETED', 'Service 30.000 km — aceite, filtro, frenos completos',
      30000, 45, 'Pastillas y discos delanteros reemplazados. Traseros al 60%.',
      [{ name: 'Cambio de aceite', price: 6000 }, { name: 'Cambio de frenos', price: 22000 }, { name: 'Revisión general', price: 9000 }],
      [{ desc: 'Service 30k Civic — frenos completos', h: 4 }], 37000);

    // === GHI789 Ford Focus ===
    await insertOrder('GHI789', 'COMPLETED', 'Cambio de batería y revisión eléctrica',
      45000, 110, 'Batería descargada. Alternador funciona bien.',
      [{ name: 'Cambio de batería', price: 22000 }, { name: 'Revisión general', price: 8000 }],
      [{ desc: 'Diagnóstico eléctrico Focus', h: 1.5 }, { desc: 'Cambio de batería', h: 0.5 }], 30000);

    await insertOrder('GHI789', 'COMPLETED', 'Service 50.000 km — completo',
      50000, 60, 'Service completo con todos los fluidos y filtros. Vibración a 80km/h.',
      [{ name: 'Cambio de aceite', price: 6500 }, { name: 'Revisión general', price: 10000 }, { name: 'Alineación y balanceo', price: 9000 }],
      [{ desc: 'Service 50k Focus — desarme y limpieza', h: 3 }, { desc: 'Alineación y balanceo', h: 2 }], 25500);

    await insertOrder('GHI789', 'COMPLETED', 'Reparación de transmisión — falla en 3ra velocidad',
      55000, 20, 'Sincronizadores de 3ra velocidad desgastados.',
      [{ name: 'Cambio de transmisión', price: 38000 }, { name: 'Revisión general', price: 8000 }],
      [{ desc: 'Desarme de caja de cambios', h: 6 }, { desc: 'Reemplazo de sincronizadores', h: 4 }, { desc: 'Armado y prueba', h: 2 }], 46000);

    // === JKL012 Chevrolet Cruze ===
    await insertOrder('JKL012', 'COMPLETED', 'Service 5.000 km — primer service, aceite y filtro',
      5000, 160, 'Primer service del vehículo nuevo. Todo en orden.',
      [{ name: 'Cambio de aceite', price: 5000 }, { name: 'Revisión general', price: 7000 }],
      [{ desc: 'Service 5k Cruze — aceite y revisión', h: 1.5 }], 12000);

    await insertOrder('JKL012', 'COMPLETED', 'Service 15.000 km — aceite, filtro, alineación',
      15000, 100, 'Neumáticos desparejos. Se realizó alineación y balanceo.',
      [{ name: 'Cambio de aceite', price: 5500 }, { name: 'Alineación y balanceo', price: 8500 }],
      [{ desc: 'Service 15k Cruze — alineación', h: 2 }], 14000);

    await insertOrder('JKL012', 'COMPLETED', 'Reparación de motor — pierde agua por manguera del radiador',
      25000, 55, 'Manguera superior del radiador rota. Se reemplaza y purga el sistema.',
      [{ name: 'Reparación de motor', price: 8000 }, { name: 'Revisión general', price: 6000 }],
      [{ desc: 'Diagnóstico de refrigeración', h: 1 }, { desc: 'Reemplazo de manguera y purga', h: 1.5 }], 14000);

    await insertOrder('JKL012', 'COMPLETED', 'Service 30.000 km — aceite, distribución, frenos',
      30000, 10, 'Distribución preventiva. Pastillas y discos delanteros reemplazados.',
      [{ name: 'Cambio de aceite', price: 6000 }, { name: 'Cambio de distribución', price: 30000 }, { name: 'Cambio de frenos', price: 18000 }, { name: 'Revisión general', price: 10000 }],
      [{ desc: 'Desarme de distribución Cruze', h: 5 }, { desc: 'Cambio de frenos delanteros', h: 2.5 }, { desc: 'Armado y prueba final', h: 1.5 }], 64000);

    console.log('\n✅ Seed completado:');
    console.log('  - 14 ordenes nuevas creadas');
    console.log('  - 32 servicios insertados');
    console.log('  - 20 registros de horas');
    console.log('  - 14 facturas generadas');

    const total = await sql`SELECT COUNT(*)::int as c FROM orders`;
    console.log(`  - Total ordenes en DB: ${total[0].c}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

seed();
