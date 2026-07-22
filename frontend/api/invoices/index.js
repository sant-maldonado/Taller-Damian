const { authMiddleware, requirePermission, getClientIdForUser } = require('../auth-helpers');

module.exports = async (req, res) => {
  const { action } = req.query;

  if (action === 'list-hours') return listHours(req, res);
  if (action === 'hours-create') return createHour(req, res);
  if (action === 'hours-update') return updateHour(req, res);
  if (action === 'hours-delete') return deleteHour(req, res);

  switch (req.method) {
    case 'GET': return listInvoices(req, res);
    case 'POST': return createInvoice(req, res);
    case 'PUT': return updateInvoice(req, res);
    case 'DELETE': return deleteInvoice(req, res);
    default: return res.status(405).json({ error: 'Método no permitido' });
  }
};

// ─── Hours ────────────────────────────────────────────────

async function listHours(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sql = require('../db');
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

async function createHour(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sql = require('../db');
    const { order_id, date, hours, description, hourly_rate } = req.body;
    if (!date) return res.status(400).json({ error: 'Fecha es requerida' });

    const result = await sql`INSERT INTO hours_tracking (order_id, date, hours, description, hourly_rate, created_by)
      VALUES (${order_id || null}, ${date}, ${hours || 0}, ${description || ''}, ${hourly_rate || 0}, ${req.user.id}) RETURNING *`;

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create hour error:', error);
    return res.status(500).json({ error: 'Error al crear registro de horas' });
  }
}

async function updateHour(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sql = require('../db');
    const { id, order_id, date, hours, description, hourly_rate } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const result = await sql`UPDATE hours_tracking SET order_id = ${order_id || null}, date = ${date}, hours = ${hours}, description = ${description}, hourly_rate = ${hourly_rate}, created_at = created_at WHERE id = ${id} RETURNING *`;
    if (result.length === 0) return res.status(404).json({ error: 'Registro de horas no encontrado' });

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Update hour error:', error);
    return res.status(500).json({ error: 'Error al actualizar registro de horas' });
  }
}

async function deleteHour(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sql = require('../db');
    const { id } = req.query;
    const result = await sql`DELETE FROM hours_tracking WHERE id = ${id} RETURNING id`;

    if (result.length === 0) return res.status(404).json({ error: 'Registro de horas no encontrado' });

    return res.status(200).json({ message: 'Registro de horas eliminado' });
  } catch (error) {
    console.error('Delete hour error:', error);
    return res.status(500).json({ error: 'Error al eliminar registro de horas' });
  }
}

// ─── Invoices ─────────────────────────────────────────────

const listInvoices = requirePermission('invoices.read')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sql = require('../db');
    const { search, limit = 100, offset = 0 } = req.query;
    const lim = parseInt(limit, 10) || 100;
    const off = parseInt(offset, 10) || 0;

    if (req.user.role === 'client') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.status(200).json({ items: [], total: 0 });

      let items;
      if (search) {
        const s = `%${search}%`;
        items = await sql`SELECT i.*, 
          json_build_object('id', o.id, 'description', o.description, 'vehicles', 
            json_build_object('id', v.id, 'plate', v.plate, 'brand', v.brand, 'model', v.model, 'clients', 
              json_build_object('id', c.id, 'name', c.name, 'dni', c.dni))) as orders
          FROM invoices i
          JOIN orders o ON o.id = i.order_id
          JOIN vehicles v ON v.id = o.vehicle_id
          JOIN clients c ON c.id = v.client_id
          WHERE v.client_id = ${clientId}
          AND (i.invoice_number::text ILIKE ${s} OR o.description ILIKE ${s})
          ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`;
      } else {
        items = await sql`SELECT i.*, 
          json_build_object('id', o.id, 'description', o.description, 'vehicles', 
            json_build_object('id', v.id, 'plate', v.plate, 'brand', v.brand, 'model', v.model, 'clients', 
              json_build_object('id', c.id, 'name', c.name, 'dni', c.dni))) as orders
          FROM invoices i
          JOIN orders o ON o.id = i.order_id
          JOIN vehicles v ON v.id = o.vehicle_id
          JOIN clients c ON c.id = v.client_id
          WHERE v.client_id = ${clientId}
          ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`;
      }
      const total = items.length;
      return res.status(200).json({ items, total });
    }

    let items;
    if (search) {
      const s = `%${search}%`;
      items = await sql`SELECT i.*, 
        json_build_object('id', o.id, 'description', o.description, 'vehicles', 
          json_build_object('id', v.id, 'plate', v.plate, 'brand', v.brand, 'model', v.model, 'clients', 
            json_build_object('id', c.id, 'name', c.name, 'dni', c.dni))) as orders
        FROM invoices i
        LEFT JOIN orders o ON o.id = i.order_id
        LEFT JOIN vehicles v ON v.id = o.vehicle_id
        LEFT JOIN clients c ON c.id = v.client_id
        WHERE i.invoice_number::text ILIKE ${s} OR o.description ILIKE ${s}
        ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`;
    } else {
      items = await sql`SELECT i.*, 
        json_build_object('id', o.id, 'description', o.description, 'vehicles', 
          json_build_object('id', v.id, 'plate', v.plate, 'brand', v.brand, 'model', v.model, 'clients', 
            json_build_object('id', c.id, 'name', c.name, 'dni', c.dni))) as orders
        FROM invoices i
        LEFT JOIN orders o ON o.id = i.order_id
        LEFT JOIN vehicles v ON v.id = o.vehicle_id
        LEFT JOIN clients c ON c.id = v.client_id
        ORDER BY i.created_at DESC LIMIT ${lim} OFFSET ${off}`;
    }
    const countResult = await sql`SELECT COUNT(*)::int as total FROM invoices`;
    const total = countResult[0].total;

    return res.status(200).json({ items, total });
  } catch (error) {
    console.error('Get invoices error:', error);
    return res.status(500).json({ error: 'Error al obtener facturas' });
  }
});

const createInvoice = requirePermission('invoices.create')(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sql = require('../db');
    const { order_id, invoice_number, total, pdf_url } = req.body;
    if (!order_id || !invoice_number) return res.status(400).json({ error: 'Orden y número de factura son requeridos' });

    const result = await sql`INSERT INTO invoices (order_id, invoice_number, total, pdf_url, created_by)
      VALUES (${order_id}, ${invoice_number}, ${total || 0}, ${pdf_url || null}, ${req.user.id}) RETURNING *`;

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ error: 'Error al crear factura' });
  }
});

const updateInvoice = requirePermission('invoices.update')(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sql = require('../db');
    const { id, order_id, invoice_number, total, pdf_url } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const result = await sql`UPDATE invoices SET order_id = ${order_id}, invoice_number = ${invoice_number}, total = ${total}, pdf_url = ${pdf_url}, created_at = created_at WHERE id = ${id} RETURNING *`;
    if (result.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Update invoice error:', error);
    return res.status(500).json({ error: 'Error al actualizar factura' });
  }
});

const deleteInvoice = requirePermission('invoices.delete')(async (req, res) => {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const sql = require('../db');
    const { id } = req.query;
    const result = await sql`DELETE FROM invoices WHERE id = ${id} RETURNING id`;

    if (result.length === 0) return res.status(404).json({ error: 'Factura no encontrada' });

    return res.status(200).json({ message: 'Factura eliminada' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    return res.status(500).json({ error: 'Error al eliminar factura' });
  }
});
