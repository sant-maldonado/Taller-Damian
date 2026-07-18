# dev-scripts

Scripts reutilizables para generar informes PDF y reportes de sesion.

## Uso en otro proyecto

### Opcion 1: Copiar los scripts (recomendado)

```bash
# Copiar la carpeta dev-scripts a tu proyecto
cp -r C:\Dev\Proyectos\dev-scripts C:\Dev\TuProyecto\scripts

# Instalar dependencias
cd C:\Dev\TuProyecto\scripts
npm install

# Editar la CONFIG de cada script con los datos de tu proyecto
# Luego ejecutar:
npm run informe      # Genera HTML desde AGENTS.md
npm run changelog    # Genera PDF de sesion
npm run mejoras      # Genera PDF de mejoras
npm run preguntas    # Genera PDF de preguntas para cliente
```

### Opcion 2: Ejecutar directamente

```bash
node C:\Dev\Proyectos\dev-scripts\generar-informe.mjs
node C:\Dev\Proyectos\dev-scripts\generate-changelog-pdf.cjs
```

## Archivos

| Archivo | Descripcion |
|---------|-------------|
| `pdf-helpers.cjs` | Funciones comunes de PDF (title, section, line, boxedTable, etc.) |
| `generar-informe.mjs` | Lee AGENTS.md, corre tests, genera HTML estilizado |
| `generate-changelog-pdf.cjs` | Informe de sesion con metricas y mejoras |
| `generate-improvements-pdf.cjs` | Informe detallado de mejoras por prioridad |
| `generate-questions-pdf.cjs` | Preguntas para el cliente |
| `generate-estimate-pdf.cjs` | Estimacion de horas de desarrollo |

## Personalizacion

Cada script tiene un bloque `CONFIG` al inicio. Editalo con:

- **projectName**: Nombre de tu proyecto
- **outputFile**: Nombre del archivo de salida
- **Secciones/tabs**: Contenido especifico de tu proyecto

## Requisitos

- Node.js 18+
- `jspdf` (se instala con `npm install`)
