const h = require("./pdf-helpers.cjs");

// ============================================================
// CONFIG — Adaptá esto a tu proyecto
// ============================================================
const CONFIG = {
  projectName: "MiProyecto",
  dateStr: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
  outputFile: "informe-sesion.pdf",

  // Metricas de la portada
  metrics: [
    { label: "FECHA", value: "18 Julio 2026" },
    { label: "DURACION", value: "~4 hs" },
    { label: "TESTS", value: "39 · 7 suites" },
    { label: "BUILD", value: "0 errores" },
  ],

  // Secciones del informe (array de { title, lines })
  // Cada line es un string. Prefix con "  " para indentar, "- " para bullet.
  sections: [
    {
      title: "1. Nombre de la tarea",
      lines: [
        "Descripcion de lo que se hizo.",
        "  Detalle adicional si hace falta.",
      ],
    },
    {
      title: "2. Otra tarea",
      lines: [
        "Descripcion breve.",
      ],
    },
  ],

  // Tabla de metricas teknikas (opcional, null para omitir)
  techTable: {
    headers: ["Metrica", "Valor", "Estado"],
    rows: [
      ["Build", "0 errores", "OK"],
      ["Tests", "39 pasan (7 suites)", "OK"],
    ],
    colWidths: [55, 55, 40],
  },

  // Tabla de chunks (opcional, null para omitir)
  chunksTable: {
    headers: ["Chunk", "Tamano", "Contenido", "Nota"],
    rows: [
      ["vendor", "21 kB", "react, react-dom", "OK"],
      ["app (main)", "311 kB", "Codigo de la aplicacion", "OK"],
    ],
    colWidths: [32, 55, 65, 38],
  },

  // Mejoras futuras (opcional, null para omitir)
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
      " Limpiar .env",
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
