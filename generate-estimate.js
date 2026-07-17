const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });

const output = fs.createWriteStream('C:\\Dev\\Proyectos\\TallerDamian\\estimacion-taller-mecanico.pdf');
doc.pipe(output);

// Header
doc.fontSize(25).text('Estimación de Horas', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('Proyecto: Aplicación Taller Mecánico', { align: 'center' });
doc.moveDown();
doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, { align: 'center' });
doc.moveDown(2);

// Tasks table
const tasks = [
  { id: 1, task: 'Configurar proyecto base (React + Vite + Tailwind + PWA)', hours: 2, deps: 'Ninguna' },
  { id: 2, task: 'Configurar Supabase (auth + storage + DB)', hours: 2, deps: 'Ninguna' },
  { id: 3, task: 'Diseñar esquema de base de datos', hours: 2, deps: '#2' },
  { id: 4, task: 'Módulo de autenticación (login/registro)', hours: 3, deps: '#2, #3' },
  { id: 5, task: 'Gestión de clientes (CRUD)', hours: 4, deps: '#4' },
  { id: 6, task: 'Gestión de vehículos (CRUD)', hours: 4, deps: '#5' },
  { id: 7, task: 'Órdenes de trabajo', hours: 5, deps: '#6' },
  { id: 8, task: 'Historial de servicios por vehículo', hours: 3, deps: '#7' },
  { id: 9, task: 'Servicios predefinidos (cambio de aceite, distribución, etc.)', hours: 2, deps: '#7' },
  { id: 10, task: 'Facturación (PDF)', hours: 4, deps: '#7' },
  { id: 11, task: 'Reportes y estadísticas', hours: 4, deps: '#7' },
  { id: 12, task: 'Tracking de horas (para cobrar)', hours: 3, deps: '#4' },
  { id: 13, task: 'Configuración reutilizable para otros proyectos', hours: 2, deps: '#1' },
  { id: 14, task: 'Deploy en Vercel', hours: 1, deps: '#13' },
  { id: 15, task: 'Testing y ajustes finales', hours: 3, deps: 'Todos' },
];

// Table header
doc.fontSize(14).text('Detalle de Tareas', { underline: true });
doc.moveDown();
doc.fontSize(10);

// Column positions
const colId = 50;
const colTask = 80;
const colHours = 380;
const colDeps = 430;

// Header row
doc.font('Helvetica-Bold');
doc.text('#', colId, doc.y, { width: 25 });
doc.text('Tarea', colTask, doc.y - 12, { width: 295 });
doc.text('Horas', colHours, doc.y - 12, { width: 45 });
doc.text('Deps', colDeps, doc.y - 12, { width: 50 });
doc.moveDown();

// Separator line
doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
doc.moveDown();

// Task rows
doc.font('Helvetica');
tasks.forEach((t, i) => {
  const y = doc.y;
  doc.text(t.id.toString(), colId, y, { width: 25 });
  doc.text(t.task, colTask, y, { width: 295 });
  doc.text(t.hours.toString(), colHours, y, { width: 45 });
  doc.text(t.deps, colDeps, y, { width: 50 });
  doc.moveDown();
});

// Separator line
doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
doc.moveDown();

// Summary
doc.fontSize(14).font('Helvetica-Bold').text('Resumen de Horas', { underline: true });
doc.moveDown();
doc.fontSize(11).font('Helvetica');

const categories = [
  { cat: 'Configuración base', hours: 4 },
  { cat: 'Backend/DB', hours: 7 },
  { cat: 'Funcionalidades principales', hours: 25 },
  { cat: 'Extras', hours: 10 },
];

categories.forEach(c => {
  doc.text(`${c.cat}: ${c.hours}h`, 80);
  doc.moveDown(0.5);
});

doc.moveDown();
doc.fontSize(13).font('Helvetica-Bold').text(`TOTAL: 46 horas`, 80);
doc.moveDown(2);

// Tech stack
doc.fontSize(14).text('Stack Tecnológico', { underline: true });
doc.moveDown();
doc.fontSize(10).font('Helvetica');

const stack = [
  'Frontend: React + Vite + Tailwind CSS (tema oscuro)',
  'PWA: vite-plugin-pwa',
  'Backend: Supabase (auth + storage + DB)',
  'Base de datos: PostgreSQL (Supabase)',
  'PDF: PDFKit / jsPDF',
  'Despliegue: Vercel',
];

stack.forEach(s => {
  doc.text(`• ${s}`, 80);
  doc.moveDown(0.3);
});

doc.end();

output.on('finish', () => {
  console.log('PDF generado exitosamente: estimacion-taller-mecanico.pdf');
});
