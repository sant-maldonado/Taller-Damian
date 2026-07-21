const { authMiddleware, requirePermission, getClientIdForUser } = require('../auth-helpers');

module.exports = async (req, res) => {
  switch (req.method) {
    case 'GET': return listInvoices(req, res);
    case 'POST': return createInvoice(req, res);
    case 'PUT': return updateInvoice(req, res);
    case 'DELETE': return deleteInvoice(req, res);
    default: return res.status(405).json({ error: 'Método no permitido' });
  }
};

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
