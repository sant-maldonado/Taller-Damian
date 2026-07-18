# AGENTS.md — Log de Sesiones

## Sesion 1: Setup Inicial + PDF Estimacion
- **Setup de proyecto**: React + Vite + Tailwind CSS
- **Configuracion PWA**: vite-plugin-pwa para installabilidad
- **PDF de estimacion**: 46 horas totales, 15 tareas
- **Esquema de BD**: PostgreSQL con RLS policies
- **Dependencias**: Supabase client, Recharts, PDFKit

## Sesion 2: Desarrollo Frontend (localStorage)
- **API layer**: Capa de servicios con localStorage (api.js)
- **Componentes UI**: Modal, Input, Select, Textarea, EmptyState, StatusBadge
- **Paginas**: Dashboard, Clients, Vehicles, Orders, Services, Invoices, Reports, Hours
- **Diseño oscuro**: Tema personalizado con custom utilities
- **Sidebar fijo**: Navegacion con iconos SVG
- **Seed data**: Datos de ejemplo automaticos (10 clientes, 12 vehiculos, 12 ordenes)

## Sesion 3: Rediseño Visual
- **Actualizacion de CSS**: Tailwind v4 con @utility directives
- **Rediseño de paginas**: Services, Invoices, Reports, Hours
- **Cards y badges**: Estilos consistentes en todas las paginas
- **Layout responsive**: Sidebar + BottomNav para mobile
- **BottomNav**: Barra de navegacion inferior en celular

## Sesion 4: PWA + Deploy
- **Manifest.json**: Configuracion PWA completa
- **InstallPrompt**: Componente de instalacion automatica
- **Service Worker**: Workbox con precaching
- **Deploy Vercel**: Configuracion con vercel.json y rewrites
- **GitHub**: Repo Taller-Damian creado y push
- **Proteccion Vercel**: Desactivada para acceso publico

## Sesion 5: Dev Scripts
- **Carpeta dev-scripts**: Scripts reutilizables para PDFs
- **Scripts disponibles**: informe, changelog, mejoras, preguntas, estimacion
- **pdf-helpers**: Funciones comunes de PDF con jsPDF
- **AGENTS.md**: Archivo de log de sesiones para informes
