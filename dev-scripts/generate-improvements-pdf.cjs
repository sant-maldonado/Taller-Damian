const h = require("./pdf-helpers.cjs");

// ============================================================
// CONFIG — Adaptá esto a tu proyecto
// ============================================================
const CONFIG = {
  projectName: "MiProyecto",
  dateStr: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
  outputFile: "informe-mejoras.pdf",

  metrics: [
    { label: "FECHA", value: "18 Julio 2026" },
    { label: "DURACION", value: "~6 hs" },
    { label: "TESTS", value: "67 · 10 suites" },
    { label: "BUILD", value: "0 errores" },
  ],

  // Arreglo de partes, cada una con titulo y items
  // items: array de { text, bullet? }
  parts: [
    {
      title: "A. Correcciones iniciales",
      items: [
        { text: "A1. Fix lint error", bold: true },
        { text: "  Archivo: src/lib/utils.ts" },
        { text: "  Cambio: let html  ->  const html" },
        { text: "" },
        { text: "A2. Fix useEffect missing deps", bold: true },
        { text: "  Componente.tsx:52  - se agrego variable a deps" },
      ],
    },
    {
      title: "B. Tests de componentes",
      items: [
        { text: "  Archivo: src/test/component-integration.test.tsx" },
        { text: "  Tests agregados: 15" },
        { text: "" },
        { text: "  Suite name (5 tests)", bold: true },
        { text: "  - Test 1 se renderiza", bullet: true },
        { text: "  - Test 2 funciona", bullet: true },
        { text: "  - Test 3 visible", bullet: true },
      ],
    },
    {
      title: "C. Features nuevas",
      items: [
        { text: "  - Feature A implementada", bullet: true },
        { text: "  - Feature B implementada", bullet: true },
      ],
    },
  ],

  // Archivos modificados (array de strings)
  modifiedFiles: [
    "src/components/Componente.tsx",
    "src/pages/Dashboard.tsx",
    "src/test/component-integration.test.tsx",
  ],

  // Build info
  buildInfo: {
    title: "Build: 0 errores",
    lines: [
      "  npm run build  ->  87 entries, 1700 KiB precache",
      "  Sin errores de TypeScript",
      "  Sin warnings de chunk size",
    ],
  },

  // Tabla de tests
  testsTable: {
    headers: ["Suite", "Tests", "Tema"],
    rows: [
      ["suite-1", "6", "Descripcion del suite"],
      ["suite-2", "15", "Descripcion del suite"],
    ],
    colWidths: [48, 20, 82],
  },

  // Mejoras futuras
  improvements: {
    alta: [
      " TypeScript strict mode",
      " Lazy loading en rutas",
    ],
    media: [
      " Separar rutas de App.tsx",
      " Limpiar componentes sin usar",
    ],
    baja: [
      " Unificar imports",
      " Cobertura de tests",
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
