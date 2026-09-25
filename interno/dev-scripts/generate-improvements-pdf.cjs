const h = require("./pdf-helpers.cjs");

// ============================================================
// CONFIG — Adaptá esto a tu proyecto
// ============================================================
const CONFIG = {
  projectName: "Taller Damian",
  dateStr: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
  outputFile: "informe-mejoras.pdf",

  metrics: [
    { label: "FECHA", value: "22 Julio 2026" },
    { label: "DURACION", value: "~8 hs" },
    { label: "TESTS", value: "119 · 9 suites" },
    { label: "BUILD", value: "0 errores" },
  ],

  parts: [
    {
      title: "A. Seguridad - Credenciales y JWT",
      items: [
        { text: "A1. Credenciales admin removidas de Login.jsx", bold: true },
        { text: "  Archivo: src/pages/Login.jsx" },
        { text: "  Cambio: Eliminada linea 94 con Admin: admin@taller.com / admin123" },
        { text: "" },
        { text: "A2. JWT_SECRET rotado con lazy validation", bold: true },
        { text: "  Archivo: api/auth-helpers.js" },
        { text: "  Cambio: getJwtSecret() lazy validation (no falla en module load)" },
        { text: "  Nuevo secreto generado y subido a Vercel" },
        { text: "" },
        { text: "A3. Register endpoint bloqueado a client role", bold: true },
        { text: "  Archivo: api/auth.js" },
        { text: "  Cambio: role_name ignorado del body, hardcodeado a 'client'" },
      ],
    },
    {
      title: "B. Users Admin Panel",
      items: [
        { text: "B1. Backend CRUD completo", bold: true },
        { text: "  Archivo: api/users/index.js" },
        { text: "  Actions: list, create, update, deactivate" },
        { text: "  Permisos: users.read, users.create, users.update, users.deactivate" },
        { text: "" },
        { text: "B2. Frontend Users.jsx", bold: true },
        { text: "  Archivo: src/pages/Users.jsx" },
        { text: "  Funciones: busqueda, modal creacion/edicion, toggle activo/inactivo" },
        { text: "  Ruta: /users (solo admin)" },
      ],
    },
    {
      title: "C. Client Self-Registration",
      items: [
        { text: "C1. Register.jsx", bold: true },
        { text: "  Archivo: src/pages/Register.jsx" },
        { text: "  Campos: nombre, DNI, telefono, email, password, patente (req), marca/modelo/anio (opt)" },
        { text: "" },
        { text: "C2. Backend transaccional", bold: true },
        { text: "  Archivo: api/auth.js" },
        { text: "  Funcion: handleRegister crea user + client + vehicle en una transaccion" },
        { text: "  Deteccion duplicados: email (409), DNI (409), patente (409)" },
      ],
    },
    {
      title: "D. Branding + Mi Cuenta",
      items: [
        { text: "D1. Rebranding completo", bold: true },
        { text: "  'Taller Mecanico' -> 'Taller Damian'" },
        { text: "  Archivos: Login.jsx, Register.jsx, Sidebar.jsx, manifest.json, index.html" },
        { text: "" },
        { text: "D2. Account.jsx - Mi Cuenta", bold: true },
        { text: "  Archivo: src/pages/Account.jsx" },
        { text: "  Funciones: perfil de usuario, cambio de contrasena (bcrypt)" },
        { text: "  Endpoint: ?action=change-password en auth.js" },
      ],
    },
    {
      title: "E. Responsive Fixes",
      items: [
        { text: "E1. Touch targets", bold: true },
        { text: "  Clients, Vehicles, Hours: sm:opacity-0 sm:group-hover:opacity-100" },
        { text: "" },
        { text: "E2. Modal overflow", bold: true },
        { text: "  ui.jsx: max-h-[90vh] overflow-y-auto" },
        { text: "" },
        { text: "E3. Orders P/E/C buttons", bold: true },
        { text: "  w-8 h-8 sm:w-6 sm:h-6 (32px mobile, 24px desktop)" },
        { text: "" },
        { text: "E4. Tabs wrap", bold: true },
        { text: "  Orders y VehicleDetail: flex-wrap en tabs de filtro" },
      ],
    },
  ],

  modifiedFiles: [
    "src/pages/Login.jsx",
    "src/pages/Register.jsx",
    "src/pages/Account.jsx",
    "src/pages/Users.jsx",
    "src/pages/Orders.jsx",
    "src/pages/Clients.jsx",
    "src/pages/Vehicles.jsx",
    "src/pages/VehicleDetail.jsx",
    "src/pages/Hours.jsx",
    "src/components/ui.jsx",
    "src/components/Sidebar.jsx",
    "src/components/BottomNav.jsx",
    "src/context/AuthContext.jsx",
    "src/App.jsx",
    "src/services/api-neon.js",
    "api/auth.js",
    "api/auth-helpers.js",
    "api/users/index.js",
    "api/invoices/index.js",
    "public/manifest.json",
    "index.html",
  ],

  buildInfo: {
    title: "Build: 0 errores",
    lines: [
      "  npm run build -> vite build exitoso",
      "  119 tests pasando (9 suites)",
      "  Vercel functions: 12 -> 9 (3 slots liberados)",
      "  Sin errores de TypeScript",
    ],
  },

  testsTable: {
    headers: ["Suite", "Tests", "Tema"],
    rows: [
      ["formatters", "39", "getStatusLabel, getStatusColor, engineLabel, transLabel"],
      ["crud", "16", "safeIdent, safeOrder, createCRUD con DI"],
      ["api-neon", "14", "Capa de servicios frontend"],
      ["ui-components", "15", "StatusBadge, Modal, Input, Select, Textarea, EmptyState"],
      ["Login", "6", "Integracion con mocks"],
      ["Clients", "7", "Integracion con mocks"],
      ["Orders", "8", "Integracion con mocks"],
      ["Users", "8", "Integracion admin CRUD"],
      ["Register", "6", "Integracion self-registration"],
    ],
    colWidths: [35, 18, 87],
  },

  improvements: {
    alta: [
      "Logo personalizado del taller",
      "CUIT, direccion, telefono en facturas",
      "Notificaciones push (PWA)",
    ],
    media: [
      "Dashboard con graficos de ingresos",
      "Exportar ordenes a PDF para imprimir",
      "Historial de cambios en ordenes (audit log)",
    ],
    baja: [
      "Modo offline con sync",
      "Multi-taller (SaaS)",
      "Integracion con WhatsApp Business API",
    ],
  },
};

// ============================================================
// BUILD PDF
// ============================================================
const doc = h.createDoc();
const pos = h.yPosGetter();

h.addCoverHeader(doc, pos,
  CONFIG.projectName,
  "INFORME DE MEJORAS",
  `${CONFIG.projectName} — ${CONFIG.dateStr}  |  Estado: COMPLETADO`
);

h.addMetricsBar(doc, pos, CONFIG.metrics);

// Parts
CONFIG.parts.forEach((part) => {
  h.section(doc, pos, part.title);
  part.items.forEach((item) => {
    if (item.text === "") { h.empty(doc, pos); return; }
    if (item.bullet) h.bullet(doc, pos, item.text.replace(/^\s*-\s*/, ""));
    else if (item.bold) {
      h.checkPage(doc, pos, 6);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(item.text, h.MARGIN, pos.get());
      pos.set(pos.get() + 5);
    } else h.line(doc, pos, item.text);
  });
  h.empty(doc, pos);
});

// Modified files
if (CONFIG.modifiedFiles?.length) {
  h.addPage(doc, pos);
  h.title(doc, pos, "Archivos modificados", 16);
  CONFIG.modifiedFiles.forEach((f) => h.bullet(doc, pos, f));
}

// Build info
if (CONFIG.buildInfo) {
  h.addPage(doc, pos);
  h.title(doc, pos, CONFIG.buildInfo.title, 16);
  CONFIG.buildInfo.lines.forEach((l) => h.line(doc, pos, l));
}

// Tests table
if (CONFIG.testsTable) {
  h.empty(doc, pos);
  h.section(doc, pos, "Tests");
  h.boxedTable(doc, pos, CONFIG.testsTable.headers, CONFIG.testsTable.rows, CONFIG.testsTable.colWidths);
}

// Improvements
if (CONFIG.improvements) {
  h.addPage(doc, pos);
  h.title(doc, pos, "Mejoras futuras recomendadas", 16);

  if (CONFIG.improvements.alta?.length) {
    h.section(doc, pos, "Prioridad ALTA");
    CONFIG.improvements.alta.forEach((t) => h.line(doc, pos, "  [ ]" + t));
    h.empty(doc, pos);
  }
  if (CONFIG.improvements.media?.length) {
    h.section(doc, pos, "Prioridad MEDIA");
    CONFIG.improvements.media.forEach((t) => h.line(doc, pos, "  [ ]" + t));
    h.empty(doc, pos);
  }
  if (CONFIG.improvements.baja?.length) {
    h.section(doc, pos, "Prioridad BAJA");
    CONFIG.improvements.baja.forEach((t) => h.line(doc, pos, "  [ ]" + t));
  }
}

h.addFooter(doc, CONFIG.projectName, "Informe de Mejoras", CONFIG.dateStr);

const outPath = h.path.join(__dirname, "..", CONFIG.outputFile);
doc.save(outPath);
console.log("PDF generated: " + outPath);
