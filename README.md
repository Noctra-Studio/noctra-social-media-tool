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

### 1. Habilitar autenticación

En tu proyecto Supabase:
**Authentication → Providers → Email → Enable**

### 2. Ejecutar el schema completo

En el **SQL Editor** de tu proyecto Supabase, ejecuta los siguientes bloques en orden.

---

#### BLOQUE 1 — Tablas principales

```sql
-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'owner',
  assistance_level text default 'balanced'
    check (assistance_level in ('guided', 'balanced', 'expert')),
  social_handles jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- BRAND VOICE
-- ─────────────────────────────────────────────
create table if not exists brand_voice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  tone text,
  values text[] default '{}',
  forbidden_words text[] default '{}',
  example_posts text[] default '{}',
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- BRAND PILLARS
-- ─────────────────────────────────────────────
create table if not exists brand_pillars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  color text default '#212631',
  post_count int default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- PLATFORM AUDIENCES
-- ─────────────────────────────────────────────
create table if not exists platform_audiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'linkedin', 'x')),
  audience_description text,
  pain_points text[] default '{}',
  desired_outcomes text[] default '{}',
  language_level text default 'mixed'
    check (language_level in ('technical', 'mixed', 'non-technical')),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- CONTENT IDEAS
-- ─────────────────────────────────────────────
create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  raw_idea text not null,
  platform text check (platform in ('instagram', 'linkedin', 'x')),
  status text default 'raw'
    check (status in ('raw', 'drafted', 'scheduled', 'published')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────────
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  idea_id uuid references content_ideas(id) on delete set null,
  pillar_id uuid references brand_pillars(id) on delete set null,
  platform text not null check (platform in ('instagram', 'linkedin', 'x')),
  angle text check (angle in ('opinion', 'tutorial', 'story', 'data')),
  format text,
  content jsonb not null default '{}'::jsonb,
  image_url text,
  export_metadata jsonb default '{}'::jsonb,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text default 'draft'
    check (status in ('draft', 'scheduled', 'published')),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- POST FEEDBACK
-- ─────────────────────────────────────────────
create table if not exists post_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  rating int check (rating between 1 and 5),
  used_as_published boolean default false,
  edited_before_publish boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- AI LEARNING CONTEXT
-- ─────────────────────────────────────────────
create table if not exists ai_learning_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'linkedin', 'x')),
  context_type text not null
    check (context_type in ('top_performing', 'avoided', 'style_note')),
  content text not null,
  source_post_id uuid references posts(id) on delete set null,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- IMAGE LIBRARY
-- ─────────────────────────────────────────────
create table if not exists image_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  unsplash_id text,
  url text not null,
  thumb_url text not null,
  photographer text,
  on_brand_score float check (on_brand_score between 0 and 1),
  tags text[] default '{}',
  used_in_post uuid references posts(id) on delete set null,
  saved_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- EXPORTS
-- ─────────────────────────────────────────────
create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  platform text not null,
  format text not null,
  exported_at timestamptz default now()
);
```

---

#### BLOQUE 2 — Índices de performance

```sql
create index if not exists idx_posts_user_id        on posts(user_id);
create index if not exists idx_posts_scheduled_at   on posts(scheduled_at);
create index if not exists idx_posts_platform        on posts(platform);
create index if not exists idx_posts_status          on posts(status);
create index if not exists idx_posts_pillar_id       on posts(pillar_id);
create index if not exists idx_content_ideas_user_id on content_ideas(user_id);
create index if not exists idx_content_ideas_status  on content_ideas(status);
create index if not exists idx_ai_learning_user_platform
  on ai_learning_context(user_id, platform);
create index if not exists idx_image_library_user_id on image_library(user_id);
create index if not exists idx_post_feedback_post_id on post_feedback(post_id);
```

---

#### BLOQUE 3 — Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
alter table profiles           enable row level security;
alter table brand_voice        enable row level security;
alter table brand_pillars      enable row level security;
alter table platform_audiences enable row level security;
alter table content_ideas      enable row level security;
alter table posts               enable row level security;
alter table post_feedback       enable row level security;
alter table ai_learning_context enable row level security;
alter table image_library       enable row level security;
alter table exports             enable row level security;

-- ─── profiles ────────────────────────────────
create policy "profiles: select own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── brand_voice ─────────────────────────────
create policy "brand_voice: select own"
  on brand_voice for select
  using (auth.uid() = user_id);

create policy "brand_voice: insert own"
  on brand_voice for insert
  with check (auth.uid() = user_id);

create policy "brand_voice: update own"
  on brand_voice for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "brand_voice: delete own"
  on brand_voice for delete
  using (auth.uid() = user_id);

-- ─── brand_pillars ────────────────────────────
create policy "brand_pillars: select own"
  on brand_pillars for select
  using (auth.uid() = user_id);

create policy "brand_pillars: insert own"
  on brand_pillars for insert
  with check (auth.uid() = user_id);

create policy "brand_pillars: update own"
  on brand_pillars for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "brand_pillars: delete own"
  on brand_pillars for delete
  using (auth.uid() = user_id);

-- ─── platform_audiences ───────────────────────
create policy "platform_audiences: select own"
  on platform_audiences for select
  using (auth.uid() = user_id);

create policy "platform_audiences: insert own"
  on platform_audiences for insert
  with check (auth.uid() = user_id);

create policy "platform_audiences: update own"
  on platform_audiences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "platform_audiences: delete own"
  on platform_audiences for delete
  using (auth.uid() = user_id);

-- ─── content_ideas ───────────────────────────
create policy "content_ideas: select own"
  on content_ideas for select
  using (auth.uid() = user_id);

create policy "content_ideas: insert own"
  on content_ideas for insert
  with check (auth.uid() = user_id);

create policy "content_ideas: update own"
  on content_ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_ideas: delete own"
  on content_ideas for delete
  using (auth.uid() = user_id);

-- ─── posts ───────────────────────────────────
create policy "posts: select own"
  on posts for select
  using (auth.uid() = user_id);

create policy "posts: insert own"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "posts: update own"
  on posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "posts: delete own"
  on posts for delete
  using (auth.uid() = user_id);

-- ─── post_feedback ───────────────────────────
create policy "post_feedback: select own"
  on post_feedback for select
  using (auth.uid() = user_id);

create policy "post_feedback: insert own"
  on post_feedback for insert
  with check (auth.uid() = user_id);

create policy "post_feedback: update own"
  on post_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "post_feedback: delete own"
  on post_feedback for delete
  using (auth.uid() = user_id);

-- ─── ai_learning_context ─────────────────────
create policy "ai_learning_context: select own"
  on ai_learning_context for select
  using (auth.uid() = user_id);

create policy "ai_learning_context: insert own"
  on ai_learning_context for insert
  with check (auth.uid() = user_id);

create policy "ai_learning_context: update own"
  on ai_learning_context for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ai_learning_context: delete own"
  on ai_learning_context for delete
  using (auth.uid() = user_id);

-- ─── image_library ───────────────────────────
create policy "image_library: select own"
  on image_library for select
  using (auth.uid() = user_id);

create policy "image_library: insert own"
  on image_library for insert
  with check (auth.uid() = user_id);

create policy "image_library: update own"
  on image_library for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "image_library: delete own"
  on image_library for delete
  using (auth.uid() = user_id);

-- ─── exports ─────────────────────────────────
create policy "exports: select own"
  on exports for select
  using (auth.uid() = user_id);

create policy "exports: insert own"
  on exports for insert
  with check (auth.uid() = user_id);

create policy "exports: delete own"
  on exports for delete
  using (auth.uid() = user_id);
```

---

#### BLOQUE 4 — Trigger: auto-crear perfil al registrar usuario

```sql
-- Función que crea el perfil automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

-- Trigger que ejecuta la función en cada nuevo usuario
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### 3. Verificar que RLS funciona

Después de ejecutar todos los bloques, verifica en **Table Editor** que cada tabla muestra el candado 🔒 (RLS enabled). También puedes ejecutar:

```sql
-- Debe retornar todas las tablas con rowsecurity = true
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

### 4. Crear tu usuario

**Authentication → Users → Add user → Create new user**

Usa el email y contraseña con los que quieres acceder a la app. El trigger del Bloque 4 crea el perfil en `public.profiles` automáticamente.

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

Uso interno — Noctra Studio © 2025. Todos los derechos reservados.
