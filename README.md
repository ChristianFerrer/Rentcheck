# RentCheck

**¿Este piso está caro o es una oportunidad?**

RentCheck analiza anuncios de alquiler y te dice si el precio está **BAJO**, **MEDIO** o **ELEVADO** respecto al mercado. Incluye radar de oportunidades en mapa interactivo.

[![CI](https://github.com/your-org/rentcheck/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/rentcheck/actions/workflows/ci.yml)

---

## Características

- **Análisis de precio** — Introduce la URL o los datos manualmente y obtén el veredicto en segundos
- **Algoritmo calibrado** — Ajusta por ascensor, terraza, estado del piso, planta y mobiliario
- **Radar de oportunidades** — Mapa interactivo con las zonas más baratas de Barcelona
- **Texto de negociación** — Sugerencia automática para negociar el alquiler
- **Pisos comparables** — Tabla con referencias reales de la zona
- **Auth con magic link** — Guarda tus análisis iniciando sesión con email

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| UI | TailwindCSS |
| Mapa | Leaflet + OpenStreetMap |
| Backend | API Routes (Next.js) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (magic link) |
| Deploy | Vercel |

## Inicio rápido

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/your-org/rentcheck.git
cd rentcheck
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar Supabase

Ejecuta la migración inicial en el SQL Editor de tu proyecto Supabase:

```bash
# Copia y ejecuta el contenido de:
supabase/migrations/001_initial.sql
```

Esto crea las tablas `zones` y `listings_analyses` con RLS habilitado y puebla las zonas de Barcelona.

### 4. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Inicia el servidor de producción |
| `npm run lint` | ESLint |
| `npm test` | Tests unitarios |
| `npm run test:coverage` | Tests con cobertura |

---

## Algoritmo de estimación

```
precio_estimado_base = €/m²_zona × metros_cuadrados

Ajustes multiplicativos:
  ✅ Ascensor       → +3%
  ✅ Terraza        → +5%
  ✅ Amueblado      → +2%
  ✅ Reformado      → +6%
  ❌ A reformar     → -8%
  ❌ Planta ≥4 sin ascensor → -3%

Clasificación:
  🟢 BAJO    → precio ≤ 92% del estimado
  🟡 MEDIO   → 92% – 108%
  🔴 ELEVADO → ≥ 108%

Rango devuelto: ±7%
```

---

## Estructura del proyecto

```
rentcheck/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Landing / Home
│   │   ├── resultado/          # Página de resultado
│   │   │   ├── page.tsx        # Por sesión (sin ID)
│   │   │   └── [id]/page.tsx   # Por ID (guardado en DB)
│   │   ├── radar/page.tsx      # Radar de oportunidades
│   │   └── api/                # API Routes
│   │       ├── analyze/        # POST — analiza el anuncio
│   │       ├── analysis/[id]/  # GET — detalle
│   │       └── radar/          # GET zones & deals
│   ├── components/
│   │   ├── analysis/           # Formulario + dashboard resultado
│   │   ├── radar/              # Mapa + panel lateral
│   │   ├── layout/             # Header + Footer
│   │   ├── auth/               # AuthButton
│   │   └── ui/                 # Componentes reutilizables
│   ├── lib/
│   │   ├── algorithm/          # Estimador + zonas + comparables
│   │   ├── scraper/            # Parser de URLs
│   │   └── supabase/           # Cliente, servidor, middleware
│   └── types/index.ts
├── __tests__/
│   └── algorithm.test.ts       # Tests del algoritmo
├── supabase/
│   └── migrations/001_initial.sql
└── .github/workflows/ci.yml
```

---

## API Endpoints

### `POST /api/analyze`

Analiza un anuncio de alquiler.

**Body:**
```json
{
  "city": "barcelona",
  "zone_name": "Eixample",
  "price_monthly": 1500,
  "sqm": 70,
  "bedrooms": 2,
  "bathrooms": 1,
  "floor": 3,
  "has_elevator": true,
  "has_terrace": false,
  "furnished": false,
  "condition": "bueno",
  "bills_included": false
}
```

**Respuesta:**
```json
{
  "id": "uuid-opcional",
  "label": "MEDIO",
  "estimated_price": 1478,
  "estimated_min": 1375,
  "estimated_max": 1581,
  "difference_pct": 1.5,
  "explanation": [...],
  "comparables": [...]
}
```

### `GET /api/radar/zones`

Estadísticas agregadas por zona.

### `GET /api/radar/deals?zone=Eixample`

Top 10 mejores precios en una zona.

### `GET /api/analysis/:id`

Detalle de un análisis guardado.

---

## Deploy en Vercel

1. Conecta tu repositorio en [vercel.com](https://vercel.com)
2. Añade las variables de entorno en el panel de Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (tu dominio de Vercel)
3. Deploy automático en cada push a `main`

---

## Supabase — Configuración Auth

En el panel de Supabase → Authentication → URL Configuration:

- **Site URL**: `https://tu-app.vercel.app`
- **Redirect URLs**: `https://tu-app.vercel.app/api/auth/callback`

---

## Datos de Barcelona

| Zona | €/m² referencia |
|------|----------------|
| Sarrià | 22.1 |
| Eixample | 20.5 |
| Les Corts | 19.8 |
| Ciutat Vella | 19.2 |
| Gràcia | 18.8 |
| Sant Martí | 17.5 |
| Sants | 16.2 |
| Sant Andreu | 15.1 |
| Horta | 14.5 |
| Nou Barris | 13.2 |

*Datos de referencia. Actualizar periódicamente según mercado.*

---

## Licencia

MIT
