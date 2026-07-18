const h = require("./pdf-helpers.cjs");

// ============================================================
// CONFIG — Adaptá esto a tu proyecto
// ============================================================
const CONFIG = {
  projectName: "MiProyecto",
  dateStr: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
  outputFile: "preguntas-para-cliente.pdf",

  subtitle: "Propuestas para guiar la proxima iteracion del producto.",

  // Agrupaciones de preguntas
  groups: [
    {
      title: "Funcionalidad",
      questions: [
        "Que funcionalidad extra necesitan los usuarios? Exportar datos, chat, calendario?",
        "El flujo actual cubre el proceso real o falta algun paso?",
        "Necesitan registro abierto (self-signup) o solo por invitacion?",
      ],
    },
    {
      title: "Contenido",
      questions: [
        "Las landing pages representan bien el mensaje? Quieren cambiar o agregar secciones?",
        "Falta contenido educativo o recursos descargables (guias PDF, videos)?",
      ],
    },
    {
      title: "UX / Diseno",
      questions: [
        "Probaste la app con usuarios reales? Algo que no entendieran o les costara?",
        "Preferis un dashboard mas visual (graficos, progreso) o el actual esta bien?",
      ],
    },
    {
      title: "Tecnico / Calidad",
      questions: [
        "Queres agregar analytics para saber que secciones usan mas?",
        "Necesitamos tests E2E (Playwright / Cypress) o la cobertura actual es suficiente?",
      ],
    },
    {
      title: "Prioridades futuras",
      questions: [
        "Hay fecha tentativa para el proximo deploy o release?",
        "De los issues conocidos, hay algo que te gustaria atacar ahora?",
      ],
    },
  ],
};

// ============================================================
// BUILD PDF
// ============================================================
const doc = h.createDoc();
const pos = h.yPosGetter();

// Cover
h.title(doc, pos, "Preguntas para el Cliente", 20);
doc.setFont("Helvetica", "normal");
doc.setFontSize(10);
doc.setTextColor(100, 100, 100);
doc.text(`${CONFIG.projectName} — ${CONFIG.dateStr}`, h.MARGIN, pos.get());
pos.set(pos.get() + 4);
doc.text(CONFIG.subtitle, h.MARGIN, pos.get());
pos.set(pos.get() + 10);

doc.setDrawColor(41, 65, 122);
doc.setLineWidth(0.4);
doc.line(h.MARGIN, pos.get(), h.PAGE_W - h.MARGIN, pos.get());
pos.set(pos.get() + 10);

// Questions
let qNum = 1;
CONFIG.groups.forEach((g, gi) => {
  if (gi > 0) h.addPage(doc, pos);
  h.subtitle(doc, pos, g.title);
  g.questions.forEach((q) => {
    h.question(doc, pos, `${qNum}. ${q}`);
    qNum++;
  });
  h.empty(doc, pos);
});

h.addFooter(doc, CONFIG.projectName, "Preguntas para el Cliente", CONFIG.dateStr);

const outPath = h.path.join(__dirname, "..", CONFIG.outputFile);
doc.save(outPath);
console.log("PDF generated: " + outPath);
