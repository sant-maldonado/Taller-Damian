import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ============================================================
// CONFIG — Adaptá esto a tu proyecto
// ============================================================
const CONFIG = {
  projectName: "Taller Mecanico",          // Nombre del proyecto
  rootDir: null,                       // null = auto-detecta (carpeta padre de scripts/)
  agentsFile: "AGENTS.md",            // Archivo de log de sesiones
  testCommand: "echo 'No tests yet'", // Comando de tests
  testTimeout: 60000,                  // Timeout tests (ms)
  autoOpen: true,                      // Abrir HTML al generar
};

// ============================================================
// LOGIC
// ============================================================
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = CONFIG.rootDir || join(__dirname, "..");

const hoy = new Date();
const fecha = hoy.toISOString().slice(0, 10);
const fechaEsp = hoy.toLocaleDateString("es-AR", {
  day: "numeric", month: "long", year: "numeric",
});

// Leer AGENTS.md y extraer la ultima sesion
const agentsPath = join(root, CONFIG.agentsFile);
if (!existsSync(agentsPath)) {
  console.error(`No se encontro ${CONFIG.agentsFile} en ${root}`);
  process.exit(1);
}
const agents = readFileSync(agentsPath, "utf-8");
const sesiones = agents.split("\n## ");
const ultima = sesiones[sesiones.length - 1];
const tituloSesion = ultima.split("\n")[0].trim();

// Extraer tareas (lineas con - **Title**: description)
const tareas = [];
let currentTask = null;
for (const line of ultima.split("\n")) {
  const item = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
  if (item) {
    if (currentTask) tareas.push(currentTask);
    currentTask = { title: item[1], desc: item[2] };
  } else if (currentTask && line.trim().startsWith("- ") && !line.includes("**")) {
    currentTask.desc += (currentTask.desc ? " " : "") + line.trim().slice(2);
  }
}
if (currentTask) tareas.push(currentTask);

// Correr tests
let testCount = "N/A", suiteCount = "N/A";
try {
  const out = execSync(CONFIG.testCommand, { cwd: root, encoding: "utf-8", timeout: CONFIG.testTimeout });
  const t = out.match(/(\d+)\s*pass/);
  const s = out.match(/(\d+)\s*Test Files/);
  if (t) testCount = t[1];
  if (s) suiteCount = s[1];
} catch {}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Informe de Sesion — ${fecha}</title>
<style>
  @page { margin: 2cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1a1a2e;
    line-height: 1.6;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
  }
  h1 { font-size: 26px; color: #1a3d5c; border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 8px; }
  .subtitle { color: #64748b; font-size: 14px; margin-bottom: 32px; }
  .meta { display: flex; gap: 24px; margin-bottom: 32px; padding: 16px 20px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-item .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; }
  .meta-item .value { font-size: 16px; font-weight: 700; color: #1a3d5c; }
  h2 { font-size: 18px; color: #2563eb; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .task { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 16px; margin-bottom: 8px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
  .task .desc { flex: 1; }
  .task .desc strong { display: block; font-size: 14px; color: #1a1a2e; }
  .task .desc span { font-size: 13px; color: #64748b; }
  .status { margin-top: 32px; padding: 16px 20px; background: #f0fdf4; border-radius: 10px; border: 1px solid #86efac; }
  .status h3 { font-size: 15px; color: #166534; margin-bottom: 8px; }
  .status ul { list-style: none; font-size: 13px; color: #15803d; }
  .status ul li::before { content: "\\2713 "; font-weight: 700; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } .task { break-inside: avoid; } }
</style>
</head>
<body>
<h1>Informe de Sesion</h1>
<p class="subtitle">${CONFIG.projectName} — ${fechaEsp}</p>
<div class="meta">
  <div class="meta-item"><span class="label">Fecha</span><span class="value">${fechaEsp}</span></div>
  <div class="meta-item"><span class="label">Tests</span><span class="value">${testCount} · ${suiteCount} suites</span></div>
  <div class="meta-item"><span class="label">Sesion</span><span class="value">${tituloSesion}</span></div>
</div>
<h2>Tareas realizadas</h2>
${tareas.length > 0
  ? tareas.map(t => `<div class="task"><div class="desc"><strong>${t.title}</strong><span>${t.desc || ""}</span></div></div>`).join("\n")
  : '<p style="color:#64748b;font-size:14px;">No se encontraron tareas formateadas en la ultima sesion de AGENTS.md.</p>'}
<div class="status"><h3>Estado</h3><ul><li>${testCount} tests pasan (${suiteCount} suites)</li></ul></div>
<div class="footer">${CONFIG.projectName} — Generado el ${fechaEsp}</div>
<script>window.print();</script>
</body>
</html>`;

const outPath = join(root, `informe-sesion-${fecha}.html`);
writeFileSync(outPath, html, "utf-8");
console.log(`Informe generado: ${outPath}`);
if (CONFIG.autoOpen) {
  try { execSync(`start "" "${outPath}"`, { shell: true }); } catch {}
}
