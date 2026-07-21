const { neon } = require('@neondatabase/serverless');
const { authMiddleware, requirePermission, getClientIdForUser } = require('../auth-helpers');

const sql = neon(process.env.DATABASE_URL);

module.exports = async (req, res) => {
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
    const baseQuery = `SELECT o.*, v.brand, v.model, v.plate FROM orders o JOIN vehicles v ON v.id = o.vehicle_id ${whereClause} ORDER BY o.created_at DESC LIMIT ${lim} OFFSET ${off}`;

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

const updateOrder = requirePermission('orders.update')(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para editar' });

  try {
    const { id, vehicle_id, status, description, mileage, next_service_date, next_service_km, notes, assigned_to } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const result = await sql`UPDATE orders SET vehicle_id = ${vehicle_id}, status = ${status}, description = ${description}, mileage = ${mileage}, next_service_date = ${next_service_date}, next_service_km = ${next_service_km}, notes = ${notes}, assigned_to = ${assigned_to}, updated_at = NOW() WHERE id = ${id} RETURNING *`;

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
