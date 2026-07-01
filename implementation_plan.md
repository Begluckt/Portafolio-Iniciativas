# Plan de Mejoras — Gestor de Iniciativas Claro VTR

## Estado Actual del Proyecto

El proyecto es una aplicación Next.js 16 desplegada en Vercel que gestiona un portafolio de iniciativas estratégicas para Claro VTR. Consta de:

| Componente | Archivo | Función |
|---|---|---|
| Dashboard | [page.js](file:///c:/Users/patricio.abarca/Downloads/gestor-iniciativas-next/app/page.js) | Listado con cards, filtros y búsqueda |
| Formulario | [form/page.js](file:///c:/Users/patricio.abarca/Downloads/gestor-iniciativas-next/app/form/page.js) | Crear/editar iniciativas (5 secciones) |
| Vista Documento | [read/[uuid]/page.js](file:///c:/Users/patricio.abarca/Downloads/gestor-iniciativas-next/app/read/%5Buuid%5D/page.js) | Vista lectura con impresión y export PPTX |
| Canvas Presentación | [preview/[uuid]/page.js](file:///c:/Users/patricio.abarca/Downloads/gestor-iniciativas-next/app/preview/%5Buuid%5D/page.js) | Presentación tipo slides (3 slides) |
| Sidebar | [Sidebar.js](file:///c:/Users/patricio.abarca/Downloads/gestor-iniciativas-next/app/components/Sidebar.js) | Navegación, import/export JSON |
| Capa de datos | [db.js](file:///c:/Users/patricio.abarca/Downloads/gestor-iniciativas-next/lib/db.js) | CRUD sobre Redis vía `ioredis` |
| Export PPTX | [exportPptx.js](file:///c:/Users/patricio.abarca/Downloads/gestor-iniciativas-next/lib/exportPptx.js) | Generación de PowerPoint |
| API Routes | 3 archivos en `app/api/initiatives/` | GET, POST, PUT, DELETE, Bulk Import |

---

## 1. Análisis de Base de Datos: Redis 30MB Free vs Supabase

### Situación actual con Redis (Vercel Marketplace)

| Aspecto | Estado |
|---|---|
| Capacidad | **30 MB** — suficiente para ~300-500 iniciativas en JSON |
| Modelo de datos | Un solo key (`initiatives_db`) con TODO el array serializado |
| Escalabilidad | ❌ Cada operación lee/escribe TODO el array completo |
| Consultas | ❌ No hay filtrado server-side, todo se filtra en el cliente |
| Relaciones | ❌ Imposible modelar relaciones (ej: comentarios, historial) |
| Costo futuro | Free tier limitado; si crece, el pricing de Redis Cloud escala rápido |

> [!WARNING]
> **Problema crítico de arquitectura**: Actualmente `getInitiatives()` descarga TODAS las iniciativas del servidor cada vez que se llama. `saveInitiatives()` reescribe TODAS. Si tienes 100 iniciativas y editas 1, se leen y reescriben las 100. Esto no escala y tiene riesgo de **race conditions** (dos usuarios editando al mismo tiempo = uno pierde sus datos).

### Beneficios de migrar a Supabase (PostgreSQL)

| Aspecto | Supabase Free Tier |
|---|---|
| Capacidad | **500 MB** de PostgreSQL — ~50,000+ iniciativas con índices |
| Modelo de datos | Tabla relacional con columnas tipadas, índices, constraints |
| Escalabilidad | ✅ Queries individuales por UUID, paginación server-side |
| Consultas | ✅ Filtrado, ordenamiento, búsqueda full-text en el servidor |
| Relaciones | ✅ Tablas para comentarios, historial de cambios, usuarios |
| Auth | ✅ Autenticación integrada (email, Google, etc.) — GRATIS |
| Storage | ✅ 1 GB para archivos adjuntos (mockups, documentos) |
| Realtime | ✅ Suscripciones en tiempo real para dashboards colaborativos |
| API | ✅ REST y SDK auto-generados desde el schema |

> [!IMPORTANT]
> **Recomendación: Sí, migrar a Supabase.** No solo por capacidad, sino porque la arquitectura actual de "todo en un JSON blob" es frágil. Supabase te da una base relacional real, auth, storage y realtime — todo gratis en su free tier y con mucho más margen de crecimiento.

### Tabla comparativa directa

| Criterio | Redis 30MB | Supabase Free |
|---|---|---|
| Almacenamiento | 30 MB | 500 MB |
| Tipo de datos | Key-Value (JSON blob) | Relacional (PostgreSQL) |
| Consultas complejas | ❌ | ✅ SQL completo |
| Autenticación | ❌ No incluida | ✅ Integrada |
| File Storage | ❌ | ✅ 1 GB |
| Dashboard/Admin | Básico | ✅ Panel completo |
| Costo al escalar | $$$$ (Redis Cloud) | $25/mo (más que suficiente) |
| Integración Vercel | Via env vars | Via env vars (igual de fácil) |

---

## 2. Plan de Mejoras (Sin tocar el Canvas)

### Fase 1: Infraestructura y Estabilidad
*Prioridad: CRÍTICA — resolver antes de cualquier mejora visual*

---

#### 1.1 Migración de Redis a Supabase

##### [NEW] lib/supabase.js
- Crear cliente Supabase con `@supabase/supabase-js`
- Configurar con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

##### [MODIFY] lib/db.js
- Reescribir todas las funciones CRUD para usar queries SQL individuales en vez del JSON blob
- `getInitiatives()` → `SELECT * FROM initiatives ORDER BY updated_at DESC`
- `getInitiative(uuid)` → `SELECT * FROM initiatives WHERE uuid = $1`
- `createInitiative()` → `INSERT INTO initiatives (...) VALUES (...)`
- `updateInitiative()` → `UPDATE initiatives SET ... WHERE uuid = $1`
- `deleteInitiative()` → `DELETE FROM initiatives WHERE uuid = $1`
- Eliminar el patrón de "leer todo, modificar array, guardar todo"

##### [DELETE] Dependencias obsoletas
- Eliminar `ioredis` y `@vercel/kv` de package.json

> [!TIP]
> Con Supabase, cada operación es atómica e independiente. No más race conditions, no más reescribir todo el array.

---

#### 1.2 Filtrado y búsqueda server-side

##### [MODIFY] app/api/initiatives/route.js
- Aceptar query params: `?search=`, `?segment=`, `?brand=`, `?page=`, `?limit=`
- Ejecutar filtrado en PostgreSQL en vez del cliente
- Implementar paginación real (no cargar 500 iniciativas a la vez)

##### [MODIFY] app/page.js (Dashboard)
- Cambiar el fetch para enviar parámetros de filtro al servidor
- Agregar paginación visual (botones Anterior/Siguiente o scroll infinito)

---

#### 1.3 Manejo de errores robusto

##### [MODIFY] Todas las páginas client-side
- Agregar estados de error visuales (no solo `alert()`)
- Implementar retry automático en fetches fallidos
- Mostrar toasts/notificaciones en vez de `alert()` nativos del navegador

---

### Fase 2: Mejoras Funcionales
*Prioridad: ALTA — funcionalidades que faltan para uso real*

---

#### 2.1 Autenticación y control de acceso

##### [NEW] Integración con Supabase Auth
- Login con email corporativo o Google Workspace
- Proteger las rutas API con middleware de autenticación
- Registrar quién crea/edita cada iniciativa (`created_by`, `updated_by`)

##### [NEW] app/login/page.js
- Página de login con branding Claro VTR
- Redirección automática si no hay sesión activa

##### [NEW] middleware.js
- Middleware de Next.js para proteger todas las rutas excepto `/login`

---

#### 2.2 Historial de cambios (Audit Log)

##### [NEW] Tabla `initiative_history` en Supabase
- Registrar cada modificación con: quién, cuándo, qué cambió
- Permitir ver el historial de una iniciativa en la vista de detalle

##### [MODIFY] app/read/[uuid]/page.js
- Agregar sección colapsable "Historial de cambios" al final del documento

---

#### 2.3 Comentarios por iniciativa

##### [NEW] Tabla `comments` en Supabase
- Campos: `id`, `initiative_uuid`, `author`, `content`, `created_at`

##### [NEW] app/api/initiatives/[uuid]/comments/route.js
- GET y POST para comentarios

##### [MODIFY] app/read/[uuid]/page.js
- Agregar sección de comentarios al final con input para agregar nuevos

---

#### 2.4 Estados y flujo de aprobación mejorado

##### [MODIFY] app/form/page.js
- Agregar transiciones de estado válidas (ej: Borrador → En Evaluación → Aprobado)
- No permitir saltar estados (ej: de Borrador directo a En Ejecución)

##### [MODIFY] app/page.js (Dashboard)
- Agregar filtro por estado además de por segmento
- Mostrar badge de color según estado en las cards (verde=Aprobado, amarillo=Evaluación, etc.)

---

#### 2.5 Duplicar iniciativa

##### [MODIFY] app/page.js
- Agregar botón "Duplicar" en cada card (junto a Eliminar)
- Crea una copia con nuevo UUID y nombre "Copia de [nombre original]"

---

### Fase 3: Mejoras Visuales y UX
*Prioridad: MEDIA — pulir la experiencia*

---

#### 3.1 Dashboard mejorado

##### [MODIFY] app/page.js

**KPI Cards animadas:**
- Agregar animación de conteo numérico (0 → valor real) al cargar
- Agregar íconos de color a cada card (no solo texto plano)
- Agregar mini sparklines o indicadores de tendencia (↑↓)

**Cards de iniciativas mejoradas:**
- Mostrar una barra de progreso visual según el estado
- Agregar indicador de prioridad con color (Normal=gris, Alta=naranja, Crítica=rojo pulsante)
- Mostrar tiempo transcurrido desde última actualización ("hace 2 horas")

**Empty state mejorado:**
- Cuando no hay iniciativas, mostrar una ilustración más atractiva con CTA directo

---

#### 3.2 Sidebar responsive y mejorada

##### [MODIFY] app/components/Sidebar.js
- Hacerla colapsable en pantallas pequeñas (hamburger menu)
- Agregar contador de iniciativas junto al link "Portafolio" (ej: "Portafolio (8)")
- Agregar sección de usuario logueado en la parte inferior (avatar + nombre)
- Agregar tema oscuro/claro toggle

##### [MODIFY] app/globals.css
- Agregar variables CSS para modo oscuro
- Transiciones suaves entre temas

---

#### 3.3 Formulario con mejor UX

##### [MODIFY] app/form/page.js

**Navegación entre secciones:**
- Agregar stepper visual horizontal (Paso 1 → 2 → 3 → 4 → 5) clickeable
- Highlight de la sección activa al hacer scroll

**Validación en tiempo real:**
- Campos obligatorios con indicador visual `*`
- Validación inline (bordes rojos + mensaje debajo del campo)
- No permitir guardar si faltan campos obligatorios

**Auto-guardado:**
- Guardar borrador automáticamente cada 30 segundos
- Indicador visual "Guardado ✓" / "Guardando..." en el header

---

#### 3.4 Vista de documento mejorada

##### [MODIFY] app/read/[uuid]/page.js
- Agregar tabla de contenidos lateral fija (scrollspy)
- Mejorar estilos de impresión (header con logo en cada página)
- Agregar botón "Compartir enlace" que copia la URL al portapapeles

---

#### 3.5 Transiciones y micro-animaciones

##### [MODIFY] app/globals.css + componentes
- Skeleton loaders en vez de texto "Cargando..."
- Animación de entrada para las cards del dashboard (staggered fade-in)
- Transición suave al cambiar de filtro (las cards que desaparecen se desvanecen)
- Toast notifications animadas para éxito/error (reemplazar todos los `alert()`)

---

#### 3.6 Responsive design

##### [MODIFY] Todos los componentes
- El dashboard actualmente usa `grid-cols-4` fijo para KPIs — rompe en móvil
- Sidebar fija de 260px no funciona en pantallas < 768px
- El formulario necesita stacking vertical en móvil
- La vista de presentación (Canvas) es de 1400px fijo — no se ve en tablets

---

### Fase 4: Funcionalidades Avanzadas (Futuro)
*Prioridad: BAJA — nice-to-have*

---

#### 4.1 Dashboard analítico
- Gráfico de barras: Iniciativas por estado
- Gráfico de torta: Distribución B2B vs B2C
- Timeline: Iniciativas creadas por mes
- Tabla resumen de valor económico total del portafolio (suma de MM)

#### 4.2 Exportación masiva
- Exportar a Excel (xlsx) además de JSON
- Exportar reporte consolidado en PDF con todas las iniciativas

#### 4.3 Búsqueda avanzada y favoritos
- Búsqueda full-text en todos los campos descriptivos
- Marcar iniciativas como favoritas (estrella)
- Vista "Mis favoritas" filtrada

#### 4.4 Notificaciones
- Email automático cuando una iniciativa cambia de estado
- Recordatorio si una iniciativa lleva X días sin actualización

---

## Verificación

### Automated Tests
- Crear tests para las API routes con datos de prueba
- Verificar CRUD completo contra Supabase en entorno de staging

### Manual Verification
- Importar las 8 iniciativas existentes desde [initiatives.json](file:///c:/Users/patricio.abarca/Downloads/gestor-iniciativas-next/data/initiatives.json)
- Verificar que el Canvas, la vista documento y la exportación PPTX siguen funcionando idénticamente
- Probar responsive en Chrome DevTools (mobile, tablet, desktop)
- Verificar flujo completo: Login → Crear → Editar → Presentar → Exportar → Eliminar

---

## Resumen de Prioridades

| Fase | Esfuerzo | Impacto | Recomendación |
|---|---|---|---|
| **1. Infraestructura** (Supabase + server-side) | Alto | 🔴 Crítico | Hacer primero — sin esto el resto es cosmético |
| **2. Funcional** (Auth, historial, comentarios) | Medio | 🟠 Alto | Hacer segundo — da valor real a los usuarios |
| **3. Visual/UX** (animaciones, responsive, UX) | Medio | 🟡 Medio | Hacer tercero — pule la experiencia |
| **4. Avanzadas** (analytics, notificaciones) | Alto | 🟢 Nice-to-have | Evaluar según feedback de usuarios reales |

## Open Questions

> [!IMPORTANT]
> **¿Qué fases quieres implementar?** Puedo ejecutar todas o solo las que elijas. La Fase 1 (migración a Supabase) es la más importante porque resuelve el problema de fondo que estamos teniendo ahora mismo con Redis.

> [!IMPORTANT]
> **¿Necesitas autenticación?** Si esta herramienta la usan varias personas de tu equipo, la autenticación con Supabase Auth es gratuita y protege los datos. Si solo la usas tú, podemos saltarnos esa parte.

> [!IMPORTANT]
> **¿Responsive es importante?** Si la herramienta se usa solo en escritorio (sala de reuniones, proyector), podemos depriorizarlo. Si alguien la ve desde el celular, es crítico.
