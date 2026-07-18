const { createCRUD } = require('../crud');
const sql = require('../db');
const { requirePermission } = require('../auth-helpers');

const crud = createCRUD('clients', {
  singularName: 'cliente',
  permissionPrefix: 'clients',
  searchFields: ['name', 'email', 'dni', 'phone'],
});

module.exports = async (req, res) => {
  switch (req.method) {
    case 'GET': return crud.list(req, res);
    case 'POST': return crud.create(req, res);
    case 'PUT': return crud.update(req, res);
    case 'DELETE': return crud.remove(req, res);
    default: return res.status(405).json({ error: 'Método no permitido' });
  }
};
