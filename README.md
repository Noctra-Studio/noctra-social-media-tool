# social.noctra.studio

Herramienta interna de Noctra Studio para la generación y gestión de contenido para redes sociales. Combina Anthropic (generación de texto), Gemini (visual), y Unsplash (imágenes) en un flujo editorial completo para Instagram, LinkedIn y X.

---

## ¿Qué hace esta app?

- **Genera posts** adaptados a cada plataforma con voz de marca consistente
- **Sugiere ángulos** (opinión, tutorial, historia, dato) antes de generar
- **Adapta contenido** de una plataforma a las otras automáticamente
- **Busca imágenes** en Unsplash filtradas por keywords y scored por Gemini
- **Genera imágenes** con Gemini Imagen 3 en estilo editorial Noctra
- **Aprende** de tu feedback: cada rating mejora las generaciones futuras
- **Organiza** el contenido en un calendario editorial con drag & drop
- **Captura ideas** con un botón flotante disponible en toda la app

---

## Stack

| Capa          | Tecnología                                    |
| ------------- | --------------------------------------------- |
| Framework     | Next.js 15 (App Router)                       |
| Lenguaje      | TypeScript (strict)                           |
| Estilos       | TailwindCSS                                   |
| Animaciones   | Framer Motion                                 |
| Base de datos | Supabase (PostgreSQL)                         |
| Auth          | Supabase Auth (Email/Password)                |
| IA — Texto    | Anthropic API (`claude-sonnet-4-20250514`)    |
| IA — Visual   | Google Gemini (`gemini-2.0-flash` + Imagen 3) |
| Imágenes      | Unsplash API                                  |
| Deploy        | Vercel                                        |

---

## Estructura del proyecto

```
social.noctra.studio/
├── app/
│   ├── page.tsx                  # Home — dashboard contextual
│   ├── compose/page.tsx          # Editor de posts (3 modos)
│   ├── calendar/page.tsx         # Calendario editorial
│   ├── ideas/page.tsx            # Banco de ideas
│   ├── settings/page.tsx         # Configuración y voz de marca
│   ├── login/page.tsx            # Auth
│   └── api/
│       ├── content/
│       │   ├── generate/         # Generación de texto (Anthropic)
│       │   ├── angles/           # Sugerencia de ángulos
│       │   ├── adapt/            # Adaptación cross-platform
│       │   └── suggest-ideas/    # Ideas sugeridas por IA
│       ├── visual/
│       │   ├── search/           # Búsqueda Unsplash
│       │   ├── score/            # Scoring on-brand (Gemini)
│       │   ├── generate/         # Generación de imágenes (Imagen 3)
│       │   └── overlay/          # Sugerencia de placement de texto
│       ├── calendar/             # CRUD de programación
│       ├── feedback/             # Rating de posts generados
│       └── home/
│           └── suggestions/      # Sugerencias contextuales del día
├── components/
│   ├── ui/
│   │   └── tag-input.tsx         # Input de tags reutilizable
│   └── post-feedback.tsx         # Componente de rating
├── lib/
│   ├── anthropic.ts              # Cliente Anthropic
│   ├── gemini.ts                 # Cliente Gemini
│   ├── unsplash.ts               # Cliente Unsplash
│   ├── supabase/
│   │   ├── server.ts             # Cliente server-side (cookies)
│   │   ├── client.ts             # Cliente browser-side
│   │   └── middleware.ts         # Refresh de sesión
│   └── ai/
│       ├── build-user-context.ts # Contexto de aprendizaje por usuario
│       └── extract-learnings.ts  # Extracción de learnings post-feedback
├── middleware.ts                  # Protección de rutas
└── supabase/
    └── schema.sql                 # Schema completo de la base de datos
```

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# Google Gemini
GEMINI_API_KEY=AIzaSy...

# Unsplash
UNSPLASH_ACCESS_KEY=tu-access-key
```

### Cómo obtener cada key

**Supabase**

1. Ve a [supabase.com](https://supabase.com) → tu proyecto
2. Settings → API
3. Copia `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. Copia `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copia `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

**Anthropic**

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Requiere créditos activos en Billing (prepago, ~$10 USD cubre meses de uso interno)

**Gemini**

1. Ve a [aistudio.google.com](https://aistudio.google.com)
2. Get API key → Create API key
3. Tier gratuito es suficiente para uso interno

**Unsplash**

1. Ve a [unsplash.com/developers](https://unsplash.com/developers)
2. Your apps → New Application
3. Copia el `Access Key`

---

## Configuración de Supabase

### 1. Ejecutar el schema

En el SQL Editor de tu proyecto Supabase, ejecuta el archivo completo:

```
supabase/schema.sql
```

Esto crea todas las tablas necesarias:

- `profiles` — perfil de usuario con configuración de asistencia y social handles
- `brand_voice` — voz de marca (tono, valores, palabras prohibidas, posts de referencia)
- `content_ideas` — banco de ideas capturadas
- `posts` — posts generados con estado y metadata
- `post_feedback` — ratings y notas por post
- `ai_learning_context` — learnings extraídos para mejorar generaciones
- `image_library` — imágenes guardadas con score on-brand

### 2. Habilitar autenticación

En tu proyecto Supabase:

1. Authentication → Providers → Email → Enable

### 3. Crear tu usuario

Authentication → Users → Add user → Create new user

Usa el email y contraseña con los que quieres acceder a la app.
El campo `email_confirm` se maneja automáticamente desde el dashboard.

---

## Correr en local

```bash
# 1. Clonar el repositorio
git clone https://github.com/ManudeQuevedo/noctra-social.git
cd noctra-social

# 2. Instalar dependencias
npm install

# 3. Crear variables de entorno
cp .env.example .env.local
# Edita .env.local con tus keys reales

# 4. Correr el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

Serás redirigido a `/login`. Usa el email y contraseña del usuario que creaste en Supabase.

---

## Flujo de uso

### Primera vez

1. **Login** en `/login`
2. **Configurar voz de marca** → avatar → Voz de marca
   - Define el tono, valores, palabras prohibidas y pega 2-3 posts de referencia
   - Esto es lo que hace que el contenido suene como Noctra, no como IA genérica
3. **Crear tu primer post** → Crear en el navbar

### Flujo diario

```
Home → ver sugerencias del día
  ↓
Crear → elegir modo (no sé qué publicar / tengo una idea / sé lo que quiero)
  ↓
Seleccionar plataforma + ángulo → Generar
  ↓
Revisar output → adaptar a otras plataformas si aplica
  ↓
Dar feedback (rating 1-5) → la IA aprende para la próxima generación
  ↓
Guardar como borrador → programar en el Calendario
```

### Captura rápida de ideas

El botón `+ Capturar idea` (esquina inferior derecha) está disponible en **todas las páginas**. Úsalo cuando tengas un pensamiento que no quieres perder — no tiene que ser un post completo, solo el germen de la idea.

---

## Modos de generación

### Modo A — No sé qué publicar

La IA sugiere 3 ideas basadas en tu historial, ideas guardadas sin desarrollar, y tendencias del sector. Ideal cuando abres la app sin un tema definido.

### Modo B — Tengo una idea

Escribe tu idea en texto libre. La app sugiere 4 ángulos distintos (opinión, tutorial, historia, dato) con un hook de preview para cada uno. Seleccionas el ángulo y generates.

### Modo C — Sé lo que quiero

Acceso directo al editor con plataforma y ángulo preseleccionados. Sin pasos intermedios.

---

## Sistema de aprendizaje de IA

Después de cada generación aparece el componente de feedback:

- **Rating 1-5** sobre la calidad del post generado
- **¿Lo publicaste?** — toggle que registra si se usó en producción
- **¿Lo editaste antes de publicar?** — registra si necesitó ajustes
- **Notas** — campo libre opcional

Con cada feedback, `claude-haiku` extrae learnings específicos por plataforma que se inyectan automáticamente en las siguientes generaciones. El sistema se activa a partir de **5 posts con feedback** para evitar ruido con datos insuficientes.

---

## Reglas por plataforma

|          | Instagram                 | LinkedIn                         | X                       |
| -------- | ------------------------- | -------------------------------- | ----------------------- |
| Longitud | Máx 150 palabras          | 150-250 palabras                 | Máx 270 chars / tweet   |
| Hashtags | 5-10                      | Máx 5                            | Máx 2                   |
| Formato  | Hook fuerte + CTA         | Párrafos cortos, saltos de línea | Hilo si > 280 chars     |
| Imágenes | Indispensable (1:1 o 4:5) | Recomendado (1.91:1)             | Opcional (16:9)         |
| Tono     | Visual, directo           | Autoridad + conversacional       | Conciso, opinión fuerte |

---

## Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Seguir el wizard:
# - Link to existing project o crear nuevo
# - Framework: Next.js (auto-detectado)
# - Build command: npm run build (default)
# - Output directory: .next (default)
```

Después del primer deploy, agrega las variables de entorno en:
**Vercel Dashboard → Project → Settings → Environment Variables**

Agrega las mismas 6 variables de `.env.local`.

Para el dominio `social.noctra.studio`:
**Vercel Dashboard → Project → Settings → Domains → Add Domain**

---

## Notas técnicas

- Las llamadas a Anthropic y Gemini **siempre son server-side** — las API keys nunca se exponen al cliente
- RLS (Row Level Security) habilitado en todas las tablas de Supabase — cada usuario solo accede a su propio contenido
- El scoring de imágenes de Unsplash es **lazy** — se ejecuta después de que el grid renderiza para no bloquear la UI
- El feedback de la IA se procesa en **fire-and-forget** — la UI responde inmediatamente sin esperar a que `extractLearnings()` termine
- La sesión se refresca automáticamente en cada request via el middleware de Supabase SSR

---

## Roadmap

- [ ] Publicación directa via LinkedIn API y X API
- [ ] Conexión de Instagram Business API
- [ ] Dashboard de métricas en tiempo real por plataforma
- [ ] Exportación de imágenes con overlay para descarga directa

---

## Licencia

Uso interno — Noctra Studio © 2026. Todos los derechos reservados.
