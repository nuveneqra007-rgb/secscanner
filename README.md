<div align="center">

<img src="frontend/public/logo.jpg" width="80" height="80" style="border-radius:16px" alt="SecScanner Logo" />

# SecScanner

**Plataforma de Auditoría de Ciberseguridad**

Escanea dominios, IPs y archivos en busca de vulnerabilidades — sin internet, sin servidores externos.

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Railway-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

[🔴 Demo en vivo](https://secscanner-theta.vercel.app) &nbsp;·&nbsp; [📖 Documentación](#-guía-de-inicio-rápido) &nbsp;·&nbsp; [🐛 Reportar Bug](https://github.com/nuveneqra007-rgb/secscanner/issues)

</div>

---

## ¿Qué es SecScanner?

SecScanner es una herramienta de **auditoría de seguridad web** que funciona completamente de forma local o en la nube. Analiza objetivos en busca de:

- 🔍 **Puertos abiertos** — Escaneo de los 15 puertos TCP más críticos (HTTP, SSH, bases de datos)
- 🛡️ **Headers de seguridad** — Verifica CSP, HSTS, X-Frame-Options, CORS
- 🔒 **SSL/TLS** — Validación de certificados, caducidad e identidad del emisor
- 🧬 **Fingerprinting** — Detecta tecnologías, servidor y rutas sensibles expuestas
- 🦠 **Análisis de malware** — Integración con VirusTotal (+70 motores antivirus)
- 📁 **Escaneo de archivos** — Análisis estático de PDFs, imágenes y APKs de Android

### Características principales

| Característica | Descripción |
|---|---|
| **Sin internet requerido** | Todos los motores funcionan en modo local |
| **Modo invitado** | Cualquiera puede escanear sin registrarse |
| **Multi-usuario** | Cada cuenta tiene su historial y estadísticas aislados |
| **Seguridad integrada** | Rate limiting, brute-force protection, headers de seguridad HTTP |
| **Monitoreo continuo** | Programa escaneos periódicos automáticos |
| **Virtualización local** | Docker Compose para reproducción exacta del entorno |

---

## 🖥️ Capturas de pantalla

<div align="center">

| Dashboard | Análisis de Seguridad | Login |
|---|---|---|
| ![Dashboard](docs/screenshot-dashboard.png) | ![Scan](docs/screenshot-scan.png) | ![Login](docs/screenshot-login.png) |

</div>

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Usuario / Browser                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
         ┌─────────────▼─────────────┐
         │   Frontend (Vercel CDN)   │
         │   React + Vite + Tailwind │
         └─────────────┬─────────────┘
                       │ REST API
         ┌─────────────▼─────────────┐
         │   Backend (Railway)       │
         │   FastAPI + APScheduler   │
         │   JWT Auth + Rate Limit   │
         └─────────────┬─────────────┘
                       │ SQLAlchemy
         ┌─────────────▼─────────────┐
         │   Supabase PostgreSQL     │
         │   Users · Scans · History │
         └───────────────────────────┘
```

---

## 🚀 Guía de Inicio Rápido

### Opción A — Local (recomendado para desarrollo)

**Requisitos:** Python 3.11+, Node.js 20+

```bash
# 1. Clonar el repositorio
git clone https://github.com/nuveneqra007-rgb/secscanner.git
cd secscanner

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar todo con un comando
chmod +x start.sh
./start.sh
```

Abre **http://localhost:5173** 🎉

### Opción B — Docker Compose

```bash
git clone https://github.com/nuveneqra007-rgb/secscanner.git
cd secscanner
cp .env.example .env
docker-compose up --build
```

---

## ☁️ Despliegue en Producción

### 1. Supabase (Base de datos)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings → Database → URI** y copia el connection string
3. Úsalo como `DATABASE_URL` en Railway

### 2. Railway (Backend)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Conecta tu repo GitHub → carpeta `backend/`
2. Railway detecta el Dockerfile automáticamente
3. Configura las variables de entorno:

```env
DATABASE_URL=postgresql://...   # Supabase URI
SECRET_KEY=<openssl rand -hex 32>
ALLOWED_ORIGINS=https://tu-proyecto.vercel.app
AUTH_USERNAME=admin
AUTH_PASSWORD=<contraseña segura>
```

### 3. Vercel (Frontend)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Importa tu repo → **Root Directory**: `frontend`
2. Configura la variable de entorno:

```env
VITE_API_URL=https://tu-backend.railway.app
```

---

## 🔐 Seguridad

SecScanner implementa múltiples capas de seguridad:

- **JWT (RS256)** con expiración configurable
- **Bcrypt** para hashing de contraseñas
- **Brute-force protection** — bloqueo automático tras 5 intentos fallidos (15 min)
- **Rate limiting** por IP — protege endpoints de login, registro y escaneos
- **SQL Injection** — 100% mitigado por SQLAlchemy ORM (nunca SQL crudo)
- **Security Headers** — X-Frame-Options, NOSNIFF, XSS-Protection en todas las respuestas
- **CORS** restrictivo — solo los orígenes autorizados pueden conectarse

---

## 🧰 Stack Técnico

### Backend
| Tecnología | Uso |
|---|---|
| **FastAPI** | API REST asíncrona con documentación automática |
| **SQLAlchemy** | ORM + migraciones seguras |
| **PostgreSQL / SQLite** | Producción / Desarrollo |
| **APScheduler** | Monitoreo continuo programado |
| **python-jose** | JWT authentication |
| **bcrypt** | Hashing de contraseñas |

### Frontend
| Tecnología | Uso |
|---|---|
| **React 18** | UI declarativa |
| **Vite** | Build tool ultrarrápido |
| **Tailwind CSS** | Utility-first CSS |
| **TanStack Query** | Cache y sincronización de datos |
| **React Router v6** | Navegación SPA |
| **Lucide React** | Iconografía |

---

## 📁 Estructura del Proyecto

```
secscanner/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models (User, Scan, FileScan...)
│   │   ├── routers/         # Endpoints FastAPI
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── tasks/           # Motores de escaneo
│   │   ├── middleware/      # Rate limiter, security headers
│   │   ├── auth.py          # JWT + brute-force protection
│   │   ├── config.py        # Configuración centralizada
│   │   └── main.py          # Entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Clientes HTTP
│   │   ├── components/      # Layout, ProtectedRoute...
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Dashboard, Login, Scan...
│   │   └── types/           # TypeScript interfaces
│   ├── vercel.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
├── docker-compose.yml
├── start.sh
└── stop.sh
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-caracteristica`
3. Commit: `git commit -m 'feat: descripción del cambio'`
4. Push: `git push origin feature/nueva-caracteristica`
5. Abre un Pull Request

---

## ⚠️ Aviso Legal

> **SecScanner es exclusivamente para uso ético y autorizado.**
> Solo debes escanear sistemas propios o sobre los que tengas permiso explícito por escrito.
> El uso indebido de esta herramienta puede constituir un delito informático.

---

## 📄 Licencia

Distribuido bajo la [Licencia MIT](LICENSE).

---

<div align="center">
  Hecho con ❤️ y mucho ☕ · <a href="https://github.com/nuveneqra007-rgb">@nuveneqra007-rgb</a>
</div>
