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

## Sesion 6: Neon DB + Auth + Roles + Client Filtering
- **Schema en Neon**: schema-neon.sql aplicado (12 tablas: clients, vehicles, orders, order_services, service_catalog, invoices, hours_tracking, photos, users, roles, permissions, role_permissions)
- **Users creados**: 14 usuarios — admin(3), manager(2), mechanic(3), client(5), viewer(1)
- **Roles/Permissions**: Sistema RBAC completo con 5 roles y permisos granulares
- **Client role**: client solo ve sus propios vehicles (JOIN clients.user_id → vehicles.client_id) y orders
- **Auth consolidada**: api/auth.js con query params (?action=login|register|me) — 9 functions total dentro de Vercel Hobby
- **api/package.json**: {"type":"commonjs"} para compatibilidad con Vercel
- **crud.js refactorizado**: sql.query() en vez de sql.unsafe() (neon driver no soporta unsafe para ejecutar queries), safeIdent() para SQL injection protection, clientFilter option
- **api-neon.js**: Frontend migrado de localStorage api.js a fetch-based api-neon.js
- **Logout**: Boton en Sidebar (desktop) y BottomNav (mobile, 5th icon "Salir")
- **Seed data en Neon**: 10 vehicles, 10 orders, 12 order_services, 10 services
- **Verificacion**: Todos los endpoints funcionando (admin ve todo, client solo ve sus datos)
- **Deploy exitoso**: https://tallerdamianros.vercel.app
