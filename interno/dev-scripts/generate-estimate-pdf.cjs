const h = require("./pdf-helpers.cjs");

// ============================================================
// CONFIG — Adaptá esto a tu proyecto
// ============================================================
const CONFIG = {
  projectName: "Taller Mecanico",
  dateStr: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
  outputFile: "estimacion-horas.pdf",

  subtitle: "Estimacion de desarrollo — React + Supabase + Vercel",

  metrics: [
    { label: "TOTAL", value: "46 hs" },
    { label: "TAREAS", value: "15" },
    { label: "CATEGORIAS", value: "4" },
    { label: "FECHA", value: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short" }) },
  ],

  // Tareas estimadas
  tasks: [
    { id: 1, task: "Configurar proyecto base (React + Vite + Tailwind + PWA)", hours: 2, deps: "Ninguna" },
    { id: 2, task: "Configurar Supabase (auth + storage + DB)", hours: 2, deps: "Ninguna" },
    { id: 3, task: "Disenar esquema de base de datos", hours: 2, deps: "#2" },
    { id: 4, task: "Modulo de autenticacion (login/registro)", hours: 3, deps: "#2, #3" },
    { id: 5, task: "Gestion de clientes (CRUD)", hours: 4, deps: "#4" },
    { id: 6, task: "Gestion de vehiculos (CRUD)", hours: 4, deps: "#5" },
    { id: 7, task: "Ordenes de trabajo", hours: 5, deps: "#6" },
    { id: 8, task: "Historial de servicios por vehiculo", hours: 3, deps: "#7" },
    { id: 9, task: "Servicios predefinidos (cambio de aceite, distribucion, etc.)", hours: 2, deps: "#7" },
    { id: 10, task: "Facturacion (PDF)", hours: 4, deps: "#7" },
    { id: 11, task: "Reportes y estadisticas", hours: 4, deps: "#7" },
    { id: 12, task: "Tracking de horas (para cobrar)", hours: 3, deps: "#4" },
    { id: 13, task: "Configuracion reutilizable para otros proyectos", hours: 2, deps: "#1" },
    { id: 14, task: "Deploy en Vercel", hours: 1, deps: "#13" },
    { id: 15, task: "Testing y ajustes finales", hours: 3, deps: "Todos" },
  ],

  // Resumen por categoria
  categories: [
    { name: "Configuracion base", hours: 4, tasks: 2 },
    { name: "Backend / DB", hours: 7, tasks: 3 },
    { name: "Funcionalidades principales", hours: 25, tasks: 7 },
    { name: "Extras y QA", hours: 10, tasks: 3 },
  ],

  // Stack tecnologico
  stack: [
    "Frontend: React + Vite + Tailwind CSS (tema oscuro)",
    "PWA: vite-plugin-pwa (installable)",
    "Backend: Supabase (auth + storage + DB)",
    "Base de datos: PostgreSQL (Supabase)",
    "PDF: PDFKit / jsPDF",
    "Despliegue: Vercel",
  ],
};

// ============================================================
// BUILD PDF
// ============================================================
const doc = h.createDoc();
const pos = h.yPosGetter();

// Cover
h.addCoverHeader(doc, pos,
  CONFIG.projectName,
  "ESTIMACION DE HORAS",
  `${CONFIG.subtitle}  |  ${CONFIG.dateStr}`
);

h.addMetricsBar(doc, pos, CONFIG.metrics);

// Tabla de tareas
h.title(doc, pos, "Detalle de Tareas", 16);
h.boxedTable(doc, pos,
  ["#", "Tarea", "Hs", "Deps"],
  CONFIG.tasks.map(t => [t.id, t.task, t.hours, t.deps]),
  [10, 100, 14, 36]
);

// Resumen por categoria
h.addPage(doc, pos);
h.title(doc, pos, "Resumen por Categoria", 16);
h.boxedTable(doc, pos,
  ["Categoria", "Tareas", "Horas"],
  CONFIG.categories.map(c => [c.name, c.tasks, c.hours]),
  [60, 25, 25]
);

// Total
h.empty(doc, pos);
h.empty(doc, pos);
h.section(doc, pos, "Total Estimado");
h.line(doc, pos, `  ${CONFIG.tasks.reduce((s, t) => s + t.hours, 0)} horas de desarrollo`);

// Stack tecnologico
h.empty(doc, pos);
h.section(doc, pos, "Stack Tecnologico");
CONFIG.stack.forEach(s => h.bullet(doc, pos, s));

h.addFooter(doc, CONFIG.projectName, "Estimacion de Horas", CONFIG.dateStr);

const outPath = h.path.join(__dirname, "..", CONFIG.outputFile);
doc.save(outPath);
console.log("PDF generated: " + outPath);
