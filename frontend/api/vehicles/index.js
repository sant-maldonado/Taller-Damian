const { neon } = require('@neondatabase/serverless');
const { createCRUD } = require('../crud');
const { requirePermission, getClientIdForUser } = require('../auth-helpers');

const sql = neon(process.env.DATABASE_URL);
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `Sos un asistente de taller mecanico automotriz en Argentina. Tu trabajo es ayudar al mecanico a registrar trabajos realizados en vehiculos.

Cuando el mecanico te describe lo que hizo, genera una respuesta JSON con esta estructura exacta (sin markdown, sin codigo, solo el JSON puro):
{
  "description": "Descripcion completa y profesional del trabajo realizado",
  "services": [
    {"name": "Nombre del servicio", "price": 5000, "category": "Categoria"}
  ],
  "notes": "Recomendaciones, advertencias o proximo service sugerido",
  "mileage": null
}

Reglas:
- Los precios son estimados en pesos argentinos (ARS). Usa precios de referencia realistas para Argentina 2024-2025.
- Categorias validas: Mantenimiento, Frenos, Suspension, Diagnostico, Rodado, Motor, Transmision, Confort, Electrico, Carroceria
- Si el mecanico menciona kilometraje, ponelo en "mileage"
- Si el mecanico es vago ("le hice el service"), pregunta que servicios especificos incluyo
- Siempre responde en espanol argentino
- Seo conciso pero profesional
- Si el mecanico menciona un problema (ruido, vibracion, etc), sugiere diagnosticos adicionales`;

const crud = createCRUD('vehicles', {
  singularName: 'vehículo',
  permissionPrefix: 'vehicles',
  searchFields: ['brand', 'model', 'plate', 'color'],
  clientFilter: 'client_id',
});

const listVehicles = requirePermission('vehicles.read')(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { search, limit = 100, offset = 0 } = req.query;
    const lim = parseInt(limit, 10) || 100;
    const off = parseInt(offset, 10) || 0;

    let where = [];
    let params = [];
    let idx = 1;

    if (req.user.role === 'client') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.status(200).json({ items: [], total: 0 });
      where.push(`v.client_id = $${idx}`);
      params.push(clientId);
      idx++;
    }

    if (search) {
      where.push(`(v.brand ILIKE $${idx} OR v.model ILIKE $${idx} OR v.plate ILIKE $${idx} OR v.color ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const wc = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const q = `SELECT v.*, c.name AS client_name, c.phone AS client_phone FROM vehicles v LEFT JOIN clients c ON c.id = v.client_id ${wc} ORDER BY v.created_at DESC LIMIT ${lim} OFFSET ${off}`;
    const items = params.length > 0 ? await sql.query(q, params) : await sql.query(q);

    const cq = `SELECT COUNT(*)::int as total FROM vehicles v ${wc}`;
    const cr = params.length > 0 ? await sql.query(cq, params) : await sql.query(cq);

    return res.status(200).json({ items, total: cr[0].total });
  } catch (error) {
    console.error('Get vehicles error:', error);
    return res.status(500).json({ error: 'Error al obtener vehículos' });
  }
});

async function getVehicleHistory(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID requerido' });

    if (req.user.role === 'client') {
      const clientId = await getClientIdForUser(req.user.id);
      if (!clientId) return res.status(403).json({ error: 'No autorizado' });
      const vCheck = await sql.query('SELECT id FROM vehicles WHERE id = $1 AND client_id = $2', [id, clientId]);
      if (vCheck.length === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    const vehicleResult = await sql.query(
      'SELECT v.*, c.name AS client_name, c.phone AS client_phone, c.email AS client_email, c.dni AS client_dni FROM vehicles v LEFT JOIN clients c ON c.id = v.client_id WHERE v.id = $1',
      [id]
    );
    if (vehicleResult.length === 0) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const orders = await sql.query(
      `SELECT o.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', os.id, 'name', os.name, 'price', os.price, 'notes', os.notes)) FILTER (WHERE os.id IS NOT NULL), '[]') AS services,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', i.id, 'invoice_number', i.invoice_number, 'total', i.total, 'pdf_url', i.pdf_url)) FILTER (WHERE i.id IS NOT NULL), '[]') AS invoices,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', p.id, 'url', p.url, 'caption', p.caption)) FILTER (WHERE p.id IS NOT NULL), '[]') AS photos,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', ht.id, 'hours', ht.hours, 'description', ht.description, 'date', ht.date, 'user_id', ht.user_id)) FILTER (WHERE ht.id IS NOT NULL), '[]') AS hours
       FROM orders o
       LEFT JOIN order_services os ON os.order_id = o.id
       LEFT JOIN invoices i ON i.order_id = o.id
       LEFT JOIN photos p ON p.order_id = o.id
       LEFT JOIN hours_tracking ht ON ht.order_id = o.id
       WHERE o.vehicle_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      vehicle: vehicleResult[0],
      orders,
    });
  } catch (error) {
    console.error('Get vehicle history error:', error);
    return res.status(500).json({ error: 'Error al obtener historial' });
  }
}

async function groqChat(req, res) {
  try {
    if (!['admin', 'manager', 'mechanic'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Solo mecanicos y administradores pueden usar el asistente' });
    }
    if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key de Groq no configurada' });

    const { message, vehicleContext, catalog } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

    let systemMsg = SYSTEM_PROMPT;
    if (vehicleContext) {
      systemMsg += `\n\nContexto del vehiculo actual:\n- Marca: ${vehicleContext.brand}\n- Modelo: ${vehicleContext.model}\n- Ano: ${vehicleContext.year}\n- Patente: ${vehicleContext.plate}\n- Motor: ${vehicleContext.engine_type || 'No especificado'}\n- Transmision: ${vehicleContext.transmission || 'No especificado'}\n- Kilometraje actual: ${vehicleContext.current_km ? vehicleContext.current_km.toLocaleString() + ' km' : 'No registrado'}`;
    }
    if (catalog && catalog.length > 0) {
      systemMsg += `\n\nCatalogo de servicios disponibles del taller:\n${catalog.map(s => `- ${s.name}: $${s.default_price} (${s.category})`).join('\n')}`;
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: message }], temperature: 0.3, max_tokens: 1024 }),
    });

    if (!groqRes.ok) { console.error('Groq API error:', await groqRes.text()); return res.status(502).json({ error: 'Error al consultar Groq' }); }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content || '';
    let parsed;
    try { const jsonMatch = content.match(/\{[\s\S]*\}/); parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { description: content, services: [], notes: '' }; } catch { parsed = { description: content, services: [], notes: '' }; }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Groq proxy error:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = async (req, res) => {
  const { authMiddleware } = require('../auth-helpers');

  switch (req.method) {
    case 'GET':
      if (req.query.action === 'history') return authMiddleware(getVehicleHistory)(req, res);
      if (req.query.id) return crud.get(req, res);
      return listVehicles(req, res);
    case 'POST':
      if (req.query.action === 'chat') return authMiddleware(groqChat)(req, res);
      return crud.create(req, res);
    case 'PUT': return crud.update(req, res);
    case 'DELETE': return crud.remove(req, res);
    default: return res.status(405).json({ error: 'Metodo no permitido' });
  }
};
