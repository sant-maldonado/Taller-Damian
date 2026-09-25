const h = require("./pdf-helpers.cjs");

// ============================================================
// CONFIG — Adaptá esto a tu proyecto
// ============================================================
const CONFIG = {
  projectName: "Taller Damian",
  dateStr: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
  outputFile: "preguntas-para-cliente.pdf",

  subtitle: "Preguntas para definir la proxima iteracion del taller mecanico.",

  groups: [
    {
      title: "Datos del taller",
      questions: [
        "Cual es el nombre oficial del taller? (confirmar 'Taller Damian')",
        "Cuantos trabajadores hay en el taller? (mecanicos, administrativos)",
        "Cual es la direccion completa del taller?",
        "Tiene CUIT? Cual es? (necesario para facturacion)",
        "Tiene un numero de telefono fijo o solo celular?",
        "Tiene email de contacto o redes sociales?",
      ],
    },
    {
      title: "Vehiculos y servicios",
      questions: [
        "Que marcas de vehiculos se atienden mayormente?",
        "Que servicios principales se realizan? (mecanica general, electricidad,latoneria, pintura, etc.)",
        "Hay servicios que NO se realicen y se deriven a otro taller?",
        "Cuales son los precios aproximados de los servicios mas comunes?",
        "Se venden repuestos o solo se realizan servicios?",
      ],
    },
    {
      title: "Proceso de trabajo",
      questions: [
        "Como se registra actualmente una orden de trabajo? (papel, planilla, otro software)?",
        "El cliente recibe algun comprobante al retirar el vehiculo?",
        "Se envian notificaciones al cliente cuando esta listo el vehiculo?",
        "Hay algun sistema de turnos o se atiende por orden de llegada?",
        "Se realizan presupuestos previos antes de comenzar el trabajo?",
      ],
    },
    {
      title: "Facturacion y pagos",
      questions: [
        "Se emiten facturas formales (AFIP) o solo presupuestos/remisiones?",
        "Que metodos de pago se aceptan? (efectivo, tarjeta, transferencia, QR)?",
        "Se ofrece facilidades de pago o todo es al contado?",
        "Hay clientes que pagan a termino? (cuentas corrientes)",
      ],
    },
    {
      title: "Presentacion al cliente",
      questions: [
        "El cliente va a ver la app en persona o se la mando por WhatsApp?",
        "Necesita que la app tenga su logo o estetica personalizada?",
        "Hay algun dato que quiera que aparezca en las facturas/ordenes impresas?",
        "Que dispositivo usa el cliente para acceder? (celular, tablet, PC)?",
      ],
    },
    {
      title: "Proximos pasos",
      questions: [
        "Hay fecha tentativa para empezar a usar la app en produccion?",
        "Se necesita capacitacion para el personal?",
        "Hay algun requisito legal o normativo que debamos cumplir?",
        "Que prioridad tiene el sistema de facturacion vs. la gestion de ordenes?",
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
