const { jsPDF } = require("jspdf");
const path = require("path");

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function createDoc() {
  return new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
}

function yPosGetter() {
  let y = MARGIN;
  return {
    get: () => y,
    set: (v) => { y = v; },
  };
}

function addPage(doc, pos) {
  doc.addPage();
  pos.set(MARGIN);
}

function checkPage(doc, pos, needed) {
  if (pos.get() + needed > PAGE_H - MARGIN) addPage(doc, pos);
}

function title(doc, pos, text, size = 18) {
  checkPage(doc, pos, 12);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(size);
  doc.setTextColor(41, 65, 122);
  doc.text(text, MARGIN, pos.get());
  pos.set(pos.get() + 8);
  doc.setDrawColor(41, 65, 122);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, pos.get(), PAGE_W - MARGIN, pos.get());
  pos.set(pos.get() + 6);
}

function section(doc, pos, text) {
  checkPage(doc, pos, 10);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(60, 85, 145);
  doc.text(text, MARGIN, pos.get());
  pos.set(pos.get() + 7);
}

function line(doc, pos, text, indent = 0) {
  checkPage(doc, pos, 5);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const x = MARGIN + indent * 4;
  doc.text(text, x, pos.get(), { maxWidth: CONTENT_W - indent * 4 });
  pos.set(pos.get() + 4.5);
}

function bullet(doc, pos, text, indent = 0) {
  line(doc, pos, "  - " + text, indent);
}

function empty(doc, pos) {
  pos.set(pos.get() + 3);
}

function subtitle(doc, pos, text) {
  checkPage(doc, pos, 8);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(60, 85, 145);
  doc.text(text, MARGIN, pos.get());
  pos.set(pos.get() + 7);
}

function question(doc, pos, text) {
  checkPage(doc, pos, 6);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  lines.forEach((l) => {
    doc.text(l, MARGIN, pos.get());
    pos.set(pos.get() + 4.5);
  });
}

function boxedTable(doc, pos, headers, rows, colWidths) {
  checkPage(doc, pos, 20 + rows.length * 5);
  if (!colWidths) {
    const w = Math.floor(CONTENT_W / headers.length);
    colWidths = headers.map(() => w);
  }
  const rowH = 5.5;

  doc.setDrawColor(41, 65, 122);
  doc.setLineWidth(0.3);

  // header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setFillColor(41, 65, 122);
  doc.setTextColor(255, 255, 255);
  let cx = MARGIN;
  headers.forEach((h, i) => {
    doc.rect(cx, pos.get() - 4, colWidths[i], rowH, "F");
    doc.text(h, cx + 1, pos.get() + 0.5);
    cx += colWidths[i];
  });
  pos.set(pos.get() + rowH + 1);

  // rows
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  let alt = false;
  rows.forEach((row) => {
    checkPage(doc, pos, rowH + 2);
    cx = MARGIN;
    if (alt) doc.setFillColor(240, 243, 250);
    else doc.setFillColor(255, 255, 255);
    row.forEach((cell, i) => {
      doc.rect(cx, pos.get() - 4, colWidths[i], rowH, alt ? "F" : "S");
      doc.setTextColor(50, 50, 50);
      doc.text(String(cell), cx + 1, pos.get() + 0.5);
      cx += colWidths[i];
    });
    pos.set(pos.get() + rowH + 0.5);
    alt = !alt;
  });
  pos.set(pos.get() + 2);
}

function addFooter(doc, projectName, reportTitle, dateStr) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${projectName} - ${reportTitle} - ${dateStr} - Pagina ${i} de ${pageCount}`,
      MARGIN,
      PAGE_H - 8
    );
  }
}

function addCoverHeader(doc, pos, projectName, titleText, subtitleText) {
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(41, 65, 122);
  doc.text(titleText, MARGIN, pos.get());
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(subtitleText, MARGIN, pos.get() + 6);
  pos.set(pos.get() + 16);

  doc.setDrawColor(41, 65, 122);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, pos.get(), PAGE_W - MARGIN, pos.get());
  pos.set(pos.get() + 10);
}

function addMetricsBar(doc, pos, metrics) {
  const mw = CONTENT_W / metrics.length;
  metrics.forEach((m, i) => {
    const cx = MARGIN + mw * i + mw / 2;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont("Helvetica", "normal");
    doc.text(m.label, cx, pos.get(), { align: "center" });
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(41, 65, 122);
    doc.text(m.value, cx, pos.get() + 7, { align: "center" });
  });
  pos.set(pos.get() + 16);
}

module.exports = {
  jsPDF,
  path,
  PAGE_W, PAGE_H, MARGIN, CONTENT_W,
  createDoc, yPosGetter,
  addPage, checkPage,
  title, section, line, bullet, empty, subtitle, question,
  boxedTable, addFooter, addCoverHeader, addMetricsBar,
};
