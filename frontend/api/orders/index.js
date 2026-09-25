const { neon } = require('@neondatabase/serverless');
const { authMiddleware, requirePermission, getClientIdForUser } = require('../auth-helpers');

const sql = neon(process.env.DATABASE_URL);

module.exports = async (req, res) => {
  if (req.query.action === 'add-service' && req.method === 'POST') return addService(req, res);
  if (req.query.action === 'remove-service' && req.method === 'DELETE') return removeService(req, res);
  if (req.query.action === 'fast' && req.method === 'POST') return fastCreateOrder(req, res);
  if (req.query.action === 'collect' && req.method === 'POST') return collectOrder(req, res);
  if (req.query.action === 'detail' && req.method === 'GET') return getOrderDetail(req, res);
  switch (req.method) {
    case 'GET': return listOrders(req, res);
    case 'POST': return createOrder(req, res);
    case 'PUT': return updateOrder(req, res);
    case 'DELETE': return deleteOrder(req, res);
    default: return res.status(405).json({ error: 'Método no permitido' });
  }
};

const listOrders = requirePermission('orders.read')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { search, status, limit = 100, offset = 0 } = req.query;
    const lim = parseInt(limit, 10) || 100;
    const off = parseInt(offset, 10) || 0;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const statusFilter = status && validStatuses.includes(status) ? status : null;

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (req.user.role === 'client') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.status(200).json({ items: [], total: 0 });
      where.push(`v.client_id = $${paramIdx}`);
      params.push(clientId);
      paramIdx++;
    }

    if (statusFilter) {
      where.push(`o.status = $${paramIdx}`);
      params.push(statusFilter);
      paramIdx++;
    }

    if (search) {
      where.push(`(o.description ILIKE $${paramIdx} OR o.notes ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const baseQuery = `SELECT o.*, v.brand, v.model, v.plate, c.name AS client_name, c.phone AS client_phone
      FROM orders o
      JOIN vehicles v ON v.id = o.vehicle_id
      LEFT JOIN clients c ON c.id = v.client_id
      ${whereClause} ORDER BY o.created_at DESC LIMIT ${lim} OFFSET ${off}`;

    const items = params.length > 0
      ? await sql.query(baseQuery, params)
      : await sql.query(baseQuery);

    const countQuery = `SELECT COUNT(*)::int as total FROM orders o JOIN vehicles v ON v.id = o.vehicle_id ${whereClause}`;
    const countResult = params.length > 0
      ? await sql.query(countQuery, params)
      : await sql.query(countQuery);
    const total = countResult[0].total;

    return res.status(200).json({ items, total });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

const createOrder = requirePermission('orders.create')(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para crear' });

  try {
    const { vehicle_id, status, description, mileage, next_service_date, next_service_km, notes, assigned_to } = req.body;
    if (!vehicle_id) return res.status(400).json({ error: 'Vehículo es requerido' });

    const result = await sql`INSERT INTO orders (vehicle_id, status, description, mileage, next_service_date, next_service_km, notes, assigned_to, created_by) VALUES (${vehicle_id}, ${status || 'PENDING'}, ${description || null}, ${mileage || null}, ${next_service_date || null}, ${next_service_km || null}, ${notes || null}, ${assigned_to || null}, ${req.user.id}) RETURNING *`;

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Error al crear orden' });
  }
});

const fastCreateOrder = requirePermission('orders.create')(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para crear' });

  try {
    const { plate, client_name, client_phone, brand, model, year, description, mileage, notes } = req.body;
    if (!plate || !plate.trim()) return res.status(400).json({ error: 'Patente es requerida' });

    const cleanPlate = plate.trim().toUpperCase().replace(/\s/g, '');

    const existing = await sql`
      SELECT v.*, c.id AS client_id, c.name AS client_name, c.phone AS client_phone
      FROM vehicles v
      LEFT JOIN clients c ON c.id = v.client_id
      WHERE UPPER(REPLACE(v.plate, ' ', '')) = ${cleanPlate}
      LIMIT 1
    `;

    let vehicle;
    let created = false;

    if (existing.length > 0) {
      vehicle = existing[0];
    } else {
      const clientName = (client_name || '').trim() || 'Cliente';
      const clientPhone = (client_phone || '').trim();
      const cRes = await sql`
        INSERT INTO clients (name, phone, email, dni, created_by)
        VALUES (${clientName}, ${clientPhone || ''}, ${null}, ${''}, ${req.user.id})
        RETURNING id
      `;

      const vRes = await sql`
        INSERT INTO vehicles (plate, brand, model, year, client_id, created_by)
        VALUES (${cleanPlate}, ${brand || ''}, ${model || ''}, ${year ? parseInt(year, 10) : 0}, ${cRes[0].id}, ${req.user.id})
        RETURNING *
      `;
      vehicle = vRes[0];
      created = true;
    }

    const oRes = await sql`
      INSERT INTO orders (vehicle_id, status, description, mileage, notes, created_by)
      VALUES (${vehicle.id}, 'PENDING', ${description || null}, ${mileage || null}, ${notes || null}, ${req.user.id})
      RETURNING *
    `;

    return res.status(201).json({ order: oRes[0], vehicle, created });
  } catch (error) {
    console.error('Fast order error:', error);
    return res.status(500).json({ error: 'Error al crear orden' });
  }
});

const updateOrder = requirePermission('orders.update')(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para editar' });

  try {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const allowedFields = ['status', 'description', 'mileage', 'notes', 'vehicle_id', 'next_service_date', 'next_service_km', 'assigned_to'];
    const sets = [];
    const params = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sets.push(`${field} = $${idx}`);
        params.push(data[field]);
        idx++;
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const result = await sql.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, params);

    if (result.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({ error: 'Error al actualizar orden' });
  }
});

const deleteOrder = requirePermission('orders.delete')(async (req, res) => {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para eliminar' });

  try {
    const { id } = req.query;
    const result = await sql`DELETE FROM orders WHERE id = ${id} RETURNING id`;

    if (result.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });

    return res.status(200).json({ message: 'Orden eliminada' });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({ error: 'Error al eliminar orden' });
  }
});

const addService = requirePermission('orders.update')(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { order_id, name, price } = req.body;
    if (!order_id || !name) return res.status(400).json({ error: 'order_id y name requeridos' });

    const result = await sql`INSERT INTO order_services (order_id, name, price) VALUES (${order_id}, ${name}, ${price || 0}) RETURNING *`;
    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Add service error:', error);
    return res.status(500).json({ error: 'Error al agregar servicio' });
  }
});

const removeService = requirePermission('orders.update')(async (req, res) => {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { id } = req.query;
    await sql`DELETE FROM order_services WHERE id = ${id}`;
    return res.status(200).json({ message: 'Servicio eliminado' });
  } catch (error) {
    console.error('Remove service error:', error);
    return res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

const collectOrder = requirePermission('orders.update')(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para cobrar' });

  try {
    const { order_id, total } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id requerido' });

    const [order] = await sql`SELECT * FROM orders WHERE id = ${order_id}`;
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const existing = await sql`SELECT id FROM invoices WHERE order_id = ${order_id}`;
    if (existing.length > 0) return res.status(400).json({ error: 'Esta orden ya tiene factura' });

    let computedTotal = total != null && !isNaN(parseFloat(total)) ? parseFloat(total) : null;
    if (computedTotal == null) {
      const agg = await sql`SELECT COALESCE(SUM(price), 0)::numeric AS total FROM order_services WHERE order_id = ${order_id}`;
      computedTotal = parseFloat(agg[0].total);
    }

    const invoice = await sql`
      INSERT INTO invoices (order_id, total, created_by)
      VALUES (${order_id}, ${computedTotal}, ${req.user.id})
      RETURNING *
    `;

    const updated = await sql`
      UPDATE orders SET status = 'COMPLETED', updated_at = NOW() WHERE id = ${order_id} RETURNING *
    `;

    return res.status(200).json({ invoice: invoice[0], order: updated[0], total: computedTotal });
  } catch (error) {
    console.error('Collect order error:', error);
    return res.status(500).json({ error: 'Error al cobrar orden' });
  }
});

const getOrderDetail = requirePermission('orders.read')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const [order] = await sql`
      SELECT o.*, v.plate, v.brand, v.model, v.year, v.client_id,
        c.name AS client_name, c.phone AS client_phone, c.dni AS client_dni, c.email AS client_email
      FROM orders o
      JOIN vehicles v ON v.id = o.vehicle_id
      LEFT JOIN clients c ON c.id = v.client_id
      WHERE o.id = ${id}
    `;
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    if (req.user.role === 'client') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId || order.client_id !== clientId) return res.status(403).json({ error: 'No autorizado' });
    }

    const services = await sql`SELECT * FROM order_services WHERE order_id = ${id} ORDER BY created_at`;
    const invoices = await sql`SELECT * FROM invoices WHERE order_id = ${id}`;

    const { client_id, ...rest } = order;
    return res.status(200).json({ ...rest, services, invoices });
  } catch (error) {
    console.error('Order detail error:', error);
    return res.status(500).json({ error: 'Error al obtener orden' });
  }
});
