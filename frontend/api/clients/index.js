const { neon } = require('@neondatabase/serverless');
const { authMiddleware, requirePermission, getClientIdForUser } = require('../auth-helpers');

const sql = neon(process.env.DATABASE_URL);

module.exports = async (req, res) => {
  switch (req.method) {
    case 'GET': return listClients(req, res);
    case 'POST': return createClient(req, res);
    case 'PUT': return updateClient(req, res);
    case 'DELETE': return deleteClient(req, res);
    default: return res.status(405).json({ error: 'Método no permitido' });
  }
};

const listClients = requirePermission('clients.read')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { search, limit = 100, offset = 0 } = req.query;
    const lim = parseInt(limit, 10) || 100;
    const off = parseInt(offset, 10) || 0;

    let items;
    if (req.user.role === 'client') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.status(200).json({ items: [], total: 0 });

      if (search) {
        const searchPattern = `%${search}%`;
        items = await sql`SELECT * FROM clients WHERE id = ${clientId} AND (name ILIKE ${searchPattern} OR email ILIKE ${searchPattern} OR dni ILIKE ${searchPattern} OR phone ILIKE ${searchPattern}) ORDER BY created_at DESC LIMIT ${lim} OFFSET ${off}`;
      } else {
        items = await sql`SELECT * FROM clients WHERE id = ${clientId} ORDER BY created_at DESC LIMIT ${lim} OFFSET ${off}`;
      }
      const total = items.length;
      return res.status(200).json({ items, total });
    }

    if (search) {
      const searchPattern = `%${search}%`;
      items = await sql`SELECT * FROM clients WHERE name ILIKE ${searchPattern} OR email ILIKE ${searchPattern} OR dni ILIKE ${searchPattern} OR phone ILIKE ${searchPattern} ORDER BY created_at DESC LIMIT ${lim} OFFSET ${off}`;
    } else {
      items = await sql`SELECT * FROM clients ORDER BY created_at DESC LIMIT ${lim} OFFSET ${off}`;
    }

    const countResult = await sql`SELECT COUNT(*)::int as total FROM clients`;
    const total = countResult[0].total;

    return res.status(200).json({ items, total });
  } catch (error) {
    console.error('Get clients error:', error);
    return res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

const createClient = requirePermission('clients.create')(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para crear' });

  try {
    const { name, phone, email, dni, address, notes } = req.body;
    if (!name || !phone || !dni) return res.status(400).json({ error: 'Nombre, teléfono y DNI son requeridos' });

    const result = await sql`INSERT INTO clients (name, phone, email, dni, address, notes, created_by) VALUES (${name}, ${phone}, ${email || null}, ${dni}, ${address || null}, ${notes || null}, ${req.user.id}) RETURNING *`;

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({ error: 'Error al crear cliente' });
  }
});

const updateClient = requirePermission('clients.update')(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para editar' });

  try {
    const { id, name, phone, email, dni, address, notes } = req.body;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    const result = await sql`UPDATE clients SET name = ${name}, phone = ${phone}, email = ${email}, dni = ${dni}, address = ${address}, notes = ${notes}, updated_at = NOW() WHERE id = ${id} RETURNING *`;

    if (result.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Update client error:', error);
    return res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

const deleteClient = requirePermission('clients.delete')(async (req, res) => {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });
  if (req.user.role === 'client') return res.status(403).json({ error: 'No tenés permisos para eliminar' });

  try {
    const { id } = req.query;
    const result = await sql`DELETE FROM clients WHERE id = ${id} RETURNING id`;

    if (result.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

    return res.status(200).json({ message: 'Cliente eliminado' });
  } catch (error) {
    console.error('Delete client error:', error);
    return res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});
