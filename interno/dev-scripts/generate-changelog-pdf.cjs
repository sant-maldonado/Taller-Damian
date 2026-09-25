const h = require("./pdf-helpers.cjs");

// ============================================================
// CONFIG — Adaptá esto a tu proyecto
// ============================================================
const CONFIG = {
  projectName: "Taller Damian",
  dateStr: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
  outputFile: "informe-sesion.pdf",

  metrics: [
    { label: "FECHA", value: "22 Julio 2026" },
    { label: "DURACION", value: "~8 hs" },
    { label: "TESTS", value: "119 · 9 suites" },
    { label: "BUILD", value: "0 errores" },
  ],

  sections: [
    {
      title: "1. Fase 1 - Seguridad",
      lines: [
        "Credenciales admin removidas de Login.jsx (linea 94 eliminada)",
        "JWT_SECRET rotado: weak fallback eliminado de auth-helpers.js",
        "Lazy validation via getJwtSecret() para compatibilidad con tests",
        "Neon password rotada por el usuario en Neon Console",
        "Register endpoint hardcodeado a role='client' (ignora role_name del body)",
        ".env gitignored verificado (.env* pattern ya existia)",
      ],
    },
    {
      title: "2. Fase 2 - Users Admin Panel",
      lines: [
        "Backend: users/index.js CRUD completo (list, create, update, deactivate)",
        "Frontend: Users.jsx con busqueda y modal de creacion/edicion",
        "Ruta /users agregada en App.jsx (solo admin)",
        "Sidebar: link 'Usuarios' con icono para admin",
        "BottomNav: icono Users visible solo para admin (6 cols en mobile)",
        "8 tests de integracion para Users",
      ],
    },
    {
      title: "3. Fase 3 - Client Self-Registration",
      lines: [
        "Register.jsx: formulario con nombre, DNI, telefono, email, password, patente (requerido), marca/modelo/anio (opcional)",
        "AuthContext: metodo register() agregado",
        "auth.js: handleRegister crea user + client + vehicle en una transaccion",
        "Deteccion de duplicados: email (409), DNI (409), patente (409)",
        "Ruta /register agregada en App.jsx",
        "Login.jsx: link 'No tenes cuenta? Registrate'",
        "6 tests de integracion para Register",
      ],
    },
    {
      title: "4. Fase 4 - Branding + Mi Cuenta",
      lines: [
        "'Taller Mecanico' renombrado a 'Taller Damian' en Login, Register, Sidebar, manifest.json, index.html",
        "Account.jsx: perfil de usuario + formulario de cambio de contrasena",
        "auth.js: nuevo endpoint ?action=change-password (valida contrasena actual, hashea con bcrypt)",
        "api-neon.js: auth.changePassword(data) agregado",
        "Sidebar: 'Mi cuenta' para todos los roles (incluido client)",
        "Ruta /account agregada en App.jsx",
      ],
    },
    {
      title: "5. Base de datos limpia",
      lines: [
        "Datos seed eliminados via cleanup-seed.cjs (script temporal borrado)",
        "Solo queda 1 usuario (admin@taller.com)",
        "0 clients, 0 vehicles, 0 orders, 0 invoices, 0 hours_tracking",
        "channel_binding=require removido de DATABASE_URL en Vercel",
        ".env local sincronizado: password nueva + JWT_SECRET nuevo",
      ],
    },
    {
      title: "6. Testing + Consolidacion API",
      lines: [
        "119 tests pasando en 9 suites",
        "Nuevos: Users (8 tests), Register (6 tests)",
        "API consolidation: hours->invoices (?action=list-hours), role->users (?action=list-roles)",
        "Vercel functions: 12 -> 9 (3 slots liberados)",
        "Responsive fixes: touch targets 32px mobile, modal overflow, flex-wrap tabs, hidden sm:inline",
      ],
    },
  ],

  techTable: {
    headers: ["Metrica", "Valor", "Estado"],
    rows: [
      ["Build", "0 errores", "OK"],
      ["Tests", "119 pasan (9 suites)", "OK"],
      ["Vercel Functions", "9/12 (3 libres)", "OK"],
      ["API Endpoints", "9 (consolidados)", "OK"],
      ["Tablas DB", "12 (schema completo)", "OK"],
    ],
    colWidths: [50, 60, 40],
  },

  chunksTable: null,

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
  "INFORME DE SESION",
  `${CONFIG.projectName} — ${CONFIG.dateStr}  |  Estado: COMPLETADO`
);

h.addMetricsBar(doc, pos, CONFIG.metrics);

// Secciones
CONFIG.sections.forEach((s) => {
  h.section(doc, pos, s.title);
  s.lines.forEach((l) => {
    if (l.startsWith("  ")) h.line(doc, pos, l, 2);
    else if (l.startsWith("- ")) h.bullet(doc, pos, l.slice(2));
    else h.line(doc, pos, l);
  });
  h.empty(doc, pos);
});

// Tabla tecnica
if (CONFIG.techTable) {
  h.addPage(doc, pos);
  h.title(doc, pos, "Resumen tecnico", 16);
  h.boxedTable(doc, pos, CONFIG.techTable.headers, CONFIG.techTable.rows, CONFIG.techTable.colWidths);
}

// Chunks
if (CONFIG.chunksTable) {
  h.empty(doc, pos);
  h.section(doc, pos, "Tamanos de chunks");
  h.boxedTable(doc, pos, CONFIG.chunksTable.headers, CONFIG.chunksTable.rows, CONFIG.chunksTable.colWidths);
}

// Mejoras
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

h.addFooter(doc, CONFIG.projectName, "Informe de Sesion", CONFIG.dateStr);

const outPath = h.path.join(__dirname, "..", CONFIG.outputFile);
doc.save(outPath);
console.log("PDF generated: " + outPath);
