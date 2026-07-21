const { neon } = require('@neondatabase/serverless');
const { authMiddleware, requirePermission, getClientIdForUser } = require('./auth-helpers');

const sql = neon(process.env.DATABASE_URL);

function safeIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function safeOrder(expr) {
  const parts = expr.split(/\s+/);
  return parts.map((p, i) => {
    if (i === 0) return safeIdent(p);
    return p.toUpperCase() === 'DESC' || p.toUpperCase() === 'ASC' ? p.toUpperCase() : safeIdent(p);
  }).join(' ');
}

function createCRUD(tableName, options = {}) {
  const { singularName, permissionPrefix, orderBy = 'created_at DESC', clientFilter } = options;

  async function getClientWhere(req) {
    if (!clientFilter || req.user.role !== 'client') return null;
    const clientId = await getClientIdForUser(req.user.id);
    return clientId;
  }

  const list = requirePermission(`${permissionPrefix}.read`)(async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    try {
      const { search, limit = 100, offset = 0 } = req.query;
      const lim = parseInt(limit, 10) || 100;
      const off = parseInt(offset, 10) || 0;
      const clientId = await getClientWhere(req);

      let where = '';
      const params = [];
      let paramIdx = 1;

      if (clientId) {
        where = `WHERE ${safeIdent(clientFilter)} = $${paramIdx}`;
        params.push(clientId);
        paramIdx++;
      }

      if (search && options.searchFields) {
        const searchPattern = `%${search}%`;
        const searchCond = options.searchFields.map(f => `${safeIdent(f)} ILIKE $${paramIdx}`).join(' OR ');
        where = where ? `${where} AND (${searchCond})` : `WHERE ${searchCond}`;
        params.push(searchPattern);
        paramIdx++;
      }

      const table = safeIdent(tableName);
      const orderClause = safeOrder(orderBy);
      const query = `SELECT * FROM ${table} ${where} ORDER BY ${orderClause} LIMIT ${lim} OFFSET ${off}`;
      const items = params.length > 0 ? await sql.query(query, params) : await sql.query(query);

      const countQuery = `SELECT COUNT(*)::int as total FROM ${table} ${where}`;
      const countResult = params.length > 0 ? await sql.query(countQuery, params) : await sql.query(countQuery);
      const total = countResult[0].total;

      return res.status(200).json({ items, total });
    } catch (error) {
      console.error(`Get ${tableName} error:`, error);
      return res.status(500).json({ error: `Error al obtener ${singularName || tableName}` });
    }
  });

  const get = requirePermission(`${permissionPrefix}.read`)(async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    try {
      const { id } = req.query;
      const clientId = await getClientWhere(req);
      const table = safeIdent(tableName);

      let result;
      if (clientId) {
        result = await sql.query(`SELECT * FROM ${table} WHERE id = $1 AND ${safeIdent(clientFilter)} = $2`, [id, clientId]);
      } else {
        result = await sql.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      }

      if (result.length === 0) {
        return res.status(404).json({ error: `${singularName || tableName} no encontrado` });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error(`Get ${singularName} error:`, error);
      return res.status(500).json({ error: `Error al obtener ${singularName || tableName}` });
    }
  });

  const create = requirePermission(`${permissionPrefix}.create`)(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    if (clientFilter && req.user.role === 'client') {
      return res.status(403).json({ error: 'No tenés permisos para crear' });
    }

    try {
      const data = req.body;
      data.created_by = req.user.id;

      const keys = Object.keys(data).filter(k => data[k] !== undefined);
      const values = keys.map(k => data[k]);
      const table = safeIdent(tableName);
      const cols = keys.map(k => safeIdent(k)).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const result = await sql.query(
        `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`,
        values
      );

      return res.status(201).json(result[0]);
    } catch (error) {
      console.error(`Create ${singularName} error:`, error);
      return res.status(500).json({ error: `Error al crear ${singularName || tableName}` });
    }
  });

  const update = requirePermission(`${permissionPrefix}.update`)(async (req, res) => {
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' });

    if (clientFilter && req.user.role === 'client') {
      return res.status(403).json({ error: 'No tenés permisos para editar' });
    }

    try {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ error: 'ID requerido' });

      data.updated_at = new Date().toISOString();

      const keys = Object.keys(data).filter(k => data[k] !== undefined);
      const values = keys.map(k => data[k]);
      const table = safeIdent(tableName);
      const setClause = keys.map((k, i) => `${safeIdent(k)} = $${i + 1}`).join(', ');

      const result = await sql.query(
        `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id]
      );

      if (result.length === 0) {
        return res.status(404).json({ error: `${singularName || tableName} no encontrado` });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error(`Update ${singularName} error:`, error);
      return res.status(500).json({ error: `Error al actualizar ${singularName || tableName}` });
    }
  });

  const remove = requirePermission(`${permissionPrefix}.delete`)(async (req, res) => {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Método no permitido' });

    if (clientFilter && req.user.role === 'client') {
      return res.status(403).json({ error: 'No tenés permisos para eliminar' });
    }

    try {
      const { id } = req.query;
      const table = safeIdent(tableName);
      const result = await sql.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);

      if (result.length === 0) {
        return res.status(404).json({ error: `${singularName || tableName} no encontrado` });
      }

      return res.status(200).json({ message: `${singularName || tableName} eliminado` });
    } catch (error) {
      console.error(`Delete ${singularName} error:`, error);
      return res.status(500).json({ error: `Error al eliminar ${singularName || tableName}` });
    }
  });

  return { list, get, create, update, remove };
}

module.exports = { createCRUD };
