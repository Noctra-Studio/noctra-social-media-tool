# Security Best Practices Report

## Executive Summary

La base de datos está diseñada para operar con RLS por usuario en Supabase, y la mayor parte del código sigue ese patrón. El riesgo principal aparece cuando la aplicación se sale de ese modelo y usa un cliente privilegiado con `SUPABASE_SERVICE_ROLE_KEY`: ya existe una ruta que lee posts sin filtrar por `user_id`, lo que expone contenido de otros usuarios y además lo reenvía a Anthropic. También existe un helper reutilizable que deja abierta la puerta a futuras lecturas o escrituras cross-tenant si vuelve a importarse en más endpoints.

## Critical

### SEC-001: Lectura cross-tenant de `posts` y exfiltración a un tercero

- Severity: Critical
- Impact: Un usuario autenticado puede provocar que el servidor lea posts de otros usuarios, y ese contenido se envía después a Anthropic, rompiendo la confidencialidad del contenido editorial almacenado en la base de datos.
- Evidence:
  - El esquema declara RLS por usuario sobre `posts`, por lo que la intención del sistema es aislar datos por `user_id`: [supabase/schema.sql](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/supabase/schema.sql#L148), [supabase/schema.sql](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/supabase/schema.sql#L185).
  - Existe un cliente Supabase privilegiado que usa `SUPABASE_SERVICE_ROLE_KEY`, lo que bypassa esas políticas: [lib/supabase.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase.ts#L3), [lib/supabase.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase.ts#L9).
  - La ruta `POST /api/calendar/check-repeat` importa ese cliente privilegiado: [app/api/calendar/check-repeat/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/calendar/check-repeat/route.ts#L3).
  - Esa misma ruta consulta los últimos 30 posts sin filtrar por `user_id`: [app/api/calendar/check-repeat/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/calendar/check-repeat/route.ts#L20).
  - Luego serializa parte del contenido de esos posts y lo manda a Anthropic: [app/api/calendar/check-repeat/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/calendar/check-repeat/route.ts#L34), [app/api/calendar/check-repeat/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/calendar/check-repeat/route.ts#L38).
- Why this matters:
  - Un usuario con acceso normal puede inferir o reutilizar contenido reciente de otros tenants.
  - El prompt enviado al proveedor externo contiene fragmentos reales de `content`, `angle`, `platform` y `scheduled_at`.
  - Como el helper usa service role, RLS deja de ser una protección efectiva en esta ruta.
- Recommended fix:
  - Eliminar el uso de [lib/supabase.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase.ts) en rutas multiusuario.
  - Usar el cliente SSR basado en cookies de [lib/supabase/server.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase/server.ts) para que RLS siga vigente.
  - Añadir además filtro explícito por `user.id` en la consulta, incluso si RLS ya lo aplica, como defensa en profundidad.

## High

### SEC-002: Helper privilegiado reusable que desactiva el aislamiento por usuario

- Severity: High
- Impact: Cualquier endpoint o server action que importe este helper obtiene permisos equivalentes al service role y puede leer o modificar cualquier fila, comprometiendo integridad y confidencialidad entre usuarios.
- Evidence:
  - El helper toma `SUPABASE_SERVICE_ROLE_KEY` por defecto y crea un cliente global privilegiado: [lib/supabase.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase.ts#L3), [lib/supabase.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase.ts#L9).
  - El comentario del archivo normaliza explícitamente el bypass de auth/RLS para “internal tools”: [lib/supabase.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase.ts#L6).
  - Ese helper ya fue importado por más de una ruta: [app/api/calendar/check-repeat/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/calendar/check-repeat/route.ts#L3), [app/api/account/avatar/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/account/avatar/route.ts#L3).
- Why this matters:
  - El patrón es un footgun: aunque hoy el exploit confirmado está en `check-repeat`, cualquier uso futuro puede introducir lecturas o escrituras cross-tenant sin que el código “huela” a privilegios altos.
  - El comportamiento cambia silenciosamente por entorno: si la service role key existe en producción pero no en local, los errores de autorización pueden no verse en desarrollo.
- Recommended fix:
  - Sustituir el helper por dos clientes claramente separados: uno de usuario con cookies para la app y uno administrativo encapsulado solo en tareas operativas muy concretas.
  - Renombrar o mover el cliente administrativo a un módulo imposible de importar accidentalmente desde rutas HTTP multiusuario.
  - Añadir una regla de lint o revisión para bloquear imports de service-role en `app/api/**`.

## Medium

### SEC-003: Bucket de avatares público creado y manipulado con permisos privilegiados

- Severity: Medium
- Impact: Las imágenes subidas a `avatars` quedan públicamente accesibles por URL, y la ruta que administra ese bucket lo hace con service role, fuera de cualquier política de storage por usuario.
- Evidence:
  - La ruta usa el cliente privilegiado: [app/api/account/avatar/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/account/avatar/route.ts#L3).
  - Si el bucket no existe, la app lo crea como `public: true`: [app/api/account/avatar/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/account/avatar/route.ts#L35), [app/api/account/avatar/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/account/avatar/route.ts#L48).
  - Después devuelve una URL pública permanente: [app/api/account/avatar/route.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/app/api/account/avatar/route.ts#L94).
- Why this matters:
  - Si el avatar se considera dato personal, queda expuesto fuera del contexto autenticado de la aplicación.
  - El uso de service role elimina la posibilidad de que políticas de storage mitiguen errores futuros en esta ruta.
- Recommended fix:
  - Definir el bucket y sus políticas fuera de la app, en migraciones o infraestructura.
  - Usar bucket privado con signed URLs si el avatar no debe ser público.
  - Evitar llamadas administrativas de storage desde rutas de usuario final.

## Positive Notes

- La mayor parte del acceso a datos de la app usa el cliente SSR basado en cookies: [lib/supabase/server.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase/server.ts).
- El esquema sí declara RLS sobre tablas sensibles como `profiles`, `posts`, `content_ideas`, `brand_voice` y `exports`: [supabase/schema.sql](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/supabase/schema.sql#L148).

## Suggested Remediation Order

1. Corregir `SEC-001` y retirar el cliente privilegiado de `check-repeat`.
2. Eliminar o encapsular [lib/supabase.ts](/Users/manu/Documents/1.Projects/Noctra-studio/website/noctra-social-media/lib/supabase.ts) para evitar nuevos bypass de RLS.
3. Revisar el flujo de avatares y decidir explícitamente si deben ser públicos o privados.
