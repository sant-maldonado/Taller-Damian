const { createCRUD } = require('../crud');

const crud = createCRUD('vehicles', {
  singularName: 'vehículo',
  permissionPrefix: 'vehicles',
  searchFields: ['brand', 'model', 'plate', 'color'],
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
