const sql = require('./db');
const { authMiddleware, requirePermission } = require('./auth-helpers');

function createCRUD(tableName, options = {}) {
  const { singularName, permissionPrefix, orderBy = 'created_at DESC' } = options;

  const list = requirePermission(`${permissionPrefix}.read`)(async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

    try {
      const { search, limit = 100, offset = 0 } = req.query;

      let query;
      if (search && options.searchFields) {
        const searchPattern = `%${search}%`;
        const conditions = options.searchFields.map(f => sql`${sql(f)} ILIKE ${searchPattern}`);
        const whereClause = conditions.reduce((a, b) => sql`${a} OR ${b}`);

        query = sql`SELECT * FROM ${sql(tableName)} WHERE ${whereClause} ORDER BY ${sql(orderBy)} LIMIT ${limit} OFFSET ${offset}`;
      } else {
        query = sql`SELECT * FROM ${sql(tableName)} ORDER BY ${sql(orderBy)} LIMIT ${limit} OFFSET ${offset}`;
      }

      const items = await query;
      const countResult = await sql`SELECT COUNT(*)::int as total FROM ${sql(tableName)}`;
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
      const result = await sql`SELECT * FROM ${sql(tableName)} WHERE id = ${id}`;

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

    try {
      const data = req.body;
      data.created_by = req.user.id;

      const keys = Object.keys(data).filter(k => data[k] !== undefined);
      const values = keys.map(k => data[k]);

      const result = await sql.unsafe(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
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

    try {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ error: 'ID requerido' });

      data.updated_at = new Date().toISOString();

      const keys = Object.keys(data).filter(k => data[k] !== undefined);
      const values = keys.map(k => data[k]);

      const result = await sql.unsafe(
        `UPDATE ${tableName} SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${keys.length + 1} RETURNING *`,
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

    try {
      const { id } = req.query;
      const result = await sql`DELETE FROM ${sql(tableName)} WHERE id = ${id} RETURNING id`;

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
