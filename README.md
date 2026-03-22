# 🚀 ClipHire - Guía Completa de Instalación

## ¿Qué es esto?
ClipHire es una red social completa que conecta creadores de contenido con editores de clips.
Incluye: feed de videos estilo TikTok, feed social tipo Facebook, perfiles, sistema de contratación,
subida de videos (máx. 60 seg), likes, comentarios, seguir usuarios, y más.

---

## 📋 PASO 1: Instalar Node.js (si no lo tienes)

1. Ve a https://nodejs.org
2. Descarga la versión LTS (la de la izquierda)
3. Instálalo con todo por defecto
4. Para verificar, abre una terminal y escribe:
   ```
   node --version
   ```
   Debería mostrar algo como `v20.x.x`

---

## 📋 PASO 2: Crear cuenta en Supabase (base de datos GRATIS)

1. Ve a https://supabase.com
2. Click en "Start your project" → regístrate con GitHub o email
3. Click en "New Project"
4. Nombre: `cliphire`
5. Contraseña: pon una contraseña segura (GUÁRDALA)
6. Región: escoge la más cercana a ti (East US o São Paulo)
7. Click en "Create new project" → espera 2 minutos

### Configurar la base de datos:
8. En el menú izquierdo, click en "SQL Editor"
9. Abre el archivo `supabase-schema.sql` que viene en el proyecto
10. Copia TODO el contenido y pégalo en el SQL Editor
11. Click en "Run" → debería ejecutarse sin errores

### Obtener las credenciales:
12. Ve a Settings (engranaje) → API
13. Copia estos dos valores:
    - **Project URL** → algo como `https://xxxx.supabase.co`
    - **anon public key** → una cadena larga que empieza con `eyJ...`

---

## 📋 PASO 3: Configurar el proyecto

1. Descarga/descomprime la carpeta `cliphire`
2. Abre una terminal en esa carpeta
3. Copia el archivo de ejemplo de variables:
   ```
   cp .env.local.example .env.local
   ```
4. Abre `.env.local` con cualquier editor de texto y pega tus credenciales:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-clave-aqui
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
5. Instala las dependencias:
   ```
   npm install
   ```
6. Inicia el servidor de desarrollo:
   ```
   npm run dev
   ```
7. Abre http://localhost:3000 en tu navegador → ¡deberías ver ClipHire!

---

## 📋 PASO 4: Subir a internet (Vercel - GRATIS)

1. Crea cuenta en https://vercel.com (usa tu GitHub)
2. Sube tu proyecto a GitHub:
   ```
   git init
   git add .
   git commit -m "ClipHire inicial"
   ```
   - Crea un repositorio en GitHub y sube el código
3. En Vercel, click "Add New Project"
4. Importa tu repositorio de GitHub
5. En "Environment Variables", agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu clave anon
   - `NEXT_PUBLIC_SITE_URL` = (déjalo vacío por ahora)
6. Click "Deploy" → espera 2-3 minutos
7. Vercel te dará una URL como `cliphire.vercel.app`
8. Vuelve a las variables y actualiza `NEXT_PUBLIC_SITE_URL` con esa URL
9. En Supabase → Authentication → URL Configuration:
   - Agrega tu URL de Vercel como "Redirect URL"

---

## 📋 PASO 5: Dominio personalizado (OPCIONAL - ~$10/año)

1. Compra un dominio en:
   - https://namecheap.com (recomendado, económico)
   - https://domains.google.com
   - https://name.com
2. En Vercel → Settings → Domains → agrega tu dominio
3. Configura los DNS según las instrucciones de Vercel
4. Actualiza `NEXT_PUBLIC_SITE_URL` en Vercel con tu dominio

---

## 🏗️ Estructura del proyecto

```
cliphire/
├── app/
│   ├── globals.css          # Estilos globales
│   ├── layout.tsx           # Layout raíz
│   ├── page.tsx             # Redirect inicial
│   ├── auth/
│   │   ├── page.tsx         # Login / Registro
│   │   └── callback/
│   │       └── route.ts     # Auth callback
│   └── (app)/
│       ├── layout.tsx       # Shell con navegación
│       ├── clips/
│       │   └── page.tsx     # Feed de clips (TikTok)
│       ├── feed/
│       │   └── page.tsx     # Feed social (Facebook)
│       ├── upload/
│       │   └── page.tsx     # Subir clips / posts
│       ├── explore/
│       │   └── page.tsx     # Buscar usuarios
│       └── profile/
│           ├── page.tsx     # Mi perfil
│           └── [id]/
│               └── page.tsx # Perfil de otro usuario
├── components/
│   └── AppShell.tsx         # Navegación inferior
├── lib/
│   ├── supabase-browser.ts  # Cliente Supabase (browser)
│   ├── supabase-server.ts   # Cliente Supabase (server)
│   ├── types.ts             # Tipos TypeScript
│   ├── store.ts             # Estado global (Zustand)
│   └── utils.ts             # Funciones útiles
├── supabase-schema.sql      # Esquema de base de datos
├── middleware.ts             # Auth middleware
├── .env.local.example       # Variables de entorno
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## 🔧 Funcionalidades incluidas

| Función | Descripción |
|---------|-------------|
| 🔐 Auth | Registro y login con email/contraseña |
| 👤 Perfiles | Creador o Clipper, con foto, bio, stats |
| 🎬 Feed de Clips | Videos vertical (máx 60s) estilo TikTok |
| 📰 Feed Social | Publicaciones de texto + imagen tipo Facebook |
| ❤️ Likes | En clips y publicaciones |
| 💬 Comentarios | En clips y publicaciones |
| 👥 Seguir | Seguir/dejar de seguir usuarios |
| 🔍 Explorar | Buscar clippers y creadores |
| ✂️ Contratar | Creadores contratan clippers |
| ✓ Verificación | Clippers contratados aparecen verificados |
| 📹 Subir Video | Máximo 60 segundos, con título y tags |
| 📷 Subir Imagen | Para publicaciones del feed |
| 📊 Contadores | Likes, comentarios, seguidores automáticos |
| 🔒 Seguridad | Row Level Security en toda la base de datos |

---

## 💰 Costos

| Servicio | Plan Gratis | Cuándo pagar |
|----------|-------------|--------------|
| Supabase | 500MB DB, 1GB storage, 50K usuarios | Al superar límites |
| Vercel | 100GB bandwidth | ~100K visitas/mes |
| Dominio | N/A | ~$10-12/año |

**Total para empezar: $0 (o $10 si quieres dominio)**

---

## ❓ Problemas comunes

**"Error de conexión a Supabase"**
→ Verifica que las variables en `.env.local` estén correctas

**"No puedo subir videos"**
→ Asegúrate de haber ejecutado el SQL schema completo (incluye los buckets de storage)

**"Los usuarios no se crean"**
→ Verifica que el trigger `on_auth_user_created` se ejecutó correctamente

**"Error al hacer deploy en Vercel"**
→ Asegúrate de que las variables de entorno estén configuradas en Vercel

---

## 🚀 Próximos pasos sugeridos

1. Chat en tiempo real (Supabase tiene Realtime integrado)
2. Notificaciones push
3. Sistema de pagos (Stripe o MercadoPago)
4. Algoritmo de recomendación de clips
5. Stories de 24 horas
6. Verificación de identidad para creadores
7. App móvil con React Native / Expo

¡Cualquier duda, pregunta!
