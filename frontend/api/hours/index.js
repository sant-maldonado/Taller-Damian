const { createCRUD } = require('../crud');
const { authMiddleware, requirePermission, getClientIdForUser } = require('../auth-helpers');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const base = createCRUD('hours_tracking', {
  singularName: 'registro de horas',
  permissionPrefix: 'hours',
});

module.exports = authMiddleware(async (req, res) => {
  switch (req.method) {
    case 'GET': return listWithDateFilter(req, res);
    case 'POST': return base.create(req, res);
    case 'PUT': return base.update(req, res);
    case 'DELETE': return base.remove(req, res);
    default: return res.status(405).json({ error: 'Método no permitido' });
  }
});

async function listWithDateFilter(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { date, search, limit = 100, offset = 0 } = req.query;
    const lim = parseInt(limit, 10) || 100;
    const off = parseInt(offset, 10) || 0;

    let where = '';
    const params = [];
    let paramIdx = 1;

    if (date) {
      where = `WHERE h.date = $${paramIdx}`;
      params.push(date);
      paramIdx++;
    }

    if (search) {
      const cond = `h.description ILIKE $${paramIdx}`;
      where = where ? `${where} AND ${cond}` : `WHERE ${cond}`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const query = `
      SELECT h.*, 
        json_build_object(
          'vehicles', json_build_object('plate', o_v.plate, 'brand', o_v.brand, 'model', o_v.model, 'client_id', o_v.client_id)
        ) as orders
      FROM hours_tracking h
      LEFT JOIN orders o ON o.id = h.order_id
      LEFT JOIN vehicles o_v ON o_v.id = o.vehicle_id
      ${where}
      ORDER BY h.date DESC, h.created_at DESC
      LIMIT ${lim} OFFSET ${off}
    `;
    const items = params.length > 0 ? await sql.query(query, params) : await sql.query(query);

    const countQuery = `SELECT COUNT(*)::int as total FROM hours_tracking h ${where}`;
    const countResult = params.length > 0 ? await sql.query(countQuery, params) : await sql.query(countQuery);

    return res.status(200).json({ items, total: countResult[0].total });
  } catch (error) {
    console.error('List hours error:', error);
    return res.status(500).json({ error: 'Error al obtener registros de horas' });
  }
}
