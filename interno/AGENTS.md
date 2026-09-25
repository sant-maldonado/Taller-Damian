# AGENTS.md — Log de Sesiones

## Sesion 1: Setup Inicial + PDF Estimacion
**Horas**: 6h
- **Setup de proyecto**: React + Vite + Tailwind CSS
- **Configuracion PWA**: vite-plugin-pwa para installabilidad
- **PDF de estimacion**: 46 horas totales, 15 tareas
- **Esquema de BD**: PostgreSQL con RLS policies
- **Dependencias**: Supabase client, Recharts, PDFKit

## Sesion 2: Desarrollo Frontend (localStorage)
**Horas**: 8h
- **API layer**: Capa de servicios con localStorage (api.js)
- **Componentes UI**: Modal, Input, Select, Textarea, EmptyState, StatusBadge
- **Paginas**: Dashboard, Clients, Vehicles, Orders, Services, Invoices, Reports, Hours
- **Diseño oscuro**: Tema personalizado con custom utilities
- **Sidebar fijo**: Navegacion con iconos SVG
- **Seed data**: Datos de ejemplo automaticos (10 clientes, 12 vehiculos, 12 ordenes)

## Sesion 3: Rediseño Visual
**Horas**: 4h
- **Actualizacion de CSS**: Tailwind v4 con @utility directives
- **Rediseño de paginas**: Services, Invoices, Reports, Hours
- **Cards y badges**: Estilos consistentes en todas las paginas
- **Layout responsive**: Sidebar + BottomNav para mobile
- **BottomNav**: Barra de navegacion inferior en celular

## Sesion 4: PWA + Deploy
**Horas**: 3h
- **Manifest.json**: Configuracion PWA completa
- **InstallPrompt**: Componente de instalacion automatica
- **Service Worker**: Workbox con precaching
- **Deploy Vercel**: Configuracion con vercel.json y rewrites
- **GitHub**: Repo Taller-Damian creado y push
- **Proteccion Vercel**: Desactivada para acceso publico

## Sesion 5: Dev Scripts
**Horas**: 2h
- **Carpeta dev-scripts**: Scripts reutilizables para PDFs
- **Scripts disponibles**: informe, changelog, mejoras, preguntas, estimacion
- **pdf-helpers**: Funciones comunes de PDF con jsPDF
- **AGENTS.md**: Archivo de log de sesiones para informes

## Sesion 6: Neon DB + Auth + Roles + Client Filtering
**Horas**: 10h
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

## Sesion 8: Popup orden con IA y servicios manuales
**Horas**: 6h
- **Fix filtros**: se cambió enlace de search a status en Orders.jsx
- **Vercel Build Debug**: error vite command not found por Root Directory config incorrecto
- **Fix select fondo blanco**: bg-white/[0.06] text-white en Select
- **Fix microfono repitiendo**: continuous false + isFinal check en handleVoice
- **Fix 500 order update**: updateOrder refactorizado a SQL dinámico con allowedFields
- **addService/removeService**: handlers agregados en orders/index.js via action query param
- **api-neon orders**: agregado orders.addService y .removeService en frontend
- **Estados ordenes**: botones P E C en lista de ordenes
- **Servicios manuales**: sección en popup de nueva orden con agregar/remover
- **AI button**: botón IA en input de descripción

## Sesion 9: Testing + Code Cleanup + API Consolidation
**Horas**: 5h
- **Vitest + RTL + jsdom**: Framework de testing instalado y configurado
- **105 tests**: formatters(39), crud(16), api-neon(14), ui-components(15), Login(6), Clients(7), Orders(8)
- **Dead code eliminado**: api.js (277 líneas), supabase.js (10 líneas), seedData.js (135 líneas)
- **formatters.js centralizado**: getStatusLabel, getStatusColor, engineLabel, transLabel — 8 páginas refactorizadas
- **Loading component**: Reutilizado en 8 páginas
- **Fusión API endpoints**: hours→invoices (?action=list-hours), role→users (?action=list-roles)
- **Vercel functions**: 12 → 9 (liberados 3 slots)
- **AuthContext limpio**: Solo user, loading, login, logout, checkAuth
- **Orders.jsx fixes**: catalog passed to AI, removed unused Textarea import, fixed statusLabel
- **Tests de integración**: Login, Clients, Orders con mocks de api-neon y AuthContext
- **Tests unitarios**: safeIdent, safeOrder, createCRUD con dependency injection
- **Build verificado**: vite build exitoso

## Sesion 10: Seguridad + Usuarios + Registro + Branding
**Horas**: 8h
- **Fase 1 - Seguridad**: Credenciales admin removidas de Login.jsx, JWT_SECRET rotado (weak fallback eliminado), Neon password rotada, Register endpoint locked a role='client', .env gitignored verificado
- **Fase 2 - Users Admin Panel**: users/index.js CRUD completo (list/create/update/deactivate), Users.jsx con búsqueda y modal, rutas /users y Sidebar/BottomNav links
- **Fase 3 - Client Self-Registration**: Register.jsx con DNI, patente, datos vehículo, AuthContext.register(), auth.js handleRegister (transacción user+client+vehicle)
- **Fase 4 - Branding + Mi Cuenta**: "Taller Mecánico" → "Taller Damian" en Login, Register, Sidebar, manifest, index.html. Account.jsx con perfil y cambio de contraseña. auth.js ?action=change-password
- **Base limpia**: Datos seed eliminados (solo admin), channel_binding=require removido de DATABASE_URL
- **.env local sincronizado**: Password y JWT_SECRET actualizados
- **Testing**: 119 tests, 9 suites (formatters, crud, api-neon, ui-components, Login, Clients, Orders, Users, Register)
- **API consolidation**: hours→invoices, role→users (12→9 funciones Vercel)
- **Responsive fixes**: Touch targets, modal overflow, flex-wrap tabs, hidden sm:inline

## Sesion 11: PWA + Responsive iPhone + Reestructura + Update Prompt
**Horas**: 6h
- **Base de datos limpia**: Datos seed eliminados (solo queda admin@taller.com), sincronizado .env local (password + JWT_SECRET)
- **Informes PDF**: informe-sesion (HTML/PDF), informe-mejoras.pdf, preguntas-para-cliente.pdf generados; CONFIG de los 4 scripts actualizada con datos reales
- **Reestructura repo**: Todo lo no-código movido a interno/ (AGENTS.md, database/, dev-scripts/, scripts viejos, node_modules, PDFs). Raíz = frontend/ + interno/. Scripts y README con rutas nuevas
- **PWA fixes**: Íconos PNG (192/512/apple-touch 180), offline shell (navigateFallback index.html + html en globPatterns), branding InstallPrompt ("Instalar Taller Damian"), meta-description, viewport-fit=cover
- **Responsive iPhone**: safe areas (viewport-fit, BottomNav, Layout, Modal items-end + max-h-85dvh), touch targets 44px (P/E/C/mic/IA/back/X/send/ghost), truncate en listas, grids responsive, fuentes 10→11px
- **Verificacion mobile**: 0 overflow horizontal en 375px (iPhone SE) y 430px en todas las páginas (auditoria con Chromium headless)
- **Update banner (registerType prompt)**: vite.config registerType 'prompt' + injectRegister false, src/lib/pwa.js (eventos need-refresh/update-request), main.jsx registerSW, componente UpdatePrompt.jsx ("Nueva versión disponible — Actualizar"), header Cache-Control fresh en vercel.json
- **Deploy automatico confirmado**: Proyecto Vercel conectado a GitHub (master), cada push hace auto-deploy. Commit 160070b + push → deploy success verificado en producción (manifest, íconos, sw.js, /orders 200)
- **Verificacion producción**: HTML con viewport-fit/apple-touch/manifest, sw.js solo skip condicional (SKIP_WAITING msg), Cache-Control max-age=0 must-revalidate
- **Testing**: 124 tests, 10 suites (+5 UpdatePrompt: aparece banner, Actualizar pide update, Ahora no, sesión rechazo)
