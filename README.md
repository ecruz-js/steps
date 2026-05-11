# Safe Steps

Safe Steps es una tienda web para joyería inteligente con catálogo público, carrito, contacto y panel administrativo. El backend administra productos, pedidos, mensajes, settings, autenticación admin y archivos de producto usando Appwrite Storage.

## Stack

- Frontend: React 19, CRA/CRACO, Tailwind CSS, Radix UI, lucide-react, axios.
- Backend: FastAPI, MongoDB, Motor, PyJWT, bcrypt, Appwrite Python SDK.
- Storage: Appwrite Storage, servido al frontend mediante el proxy del backend en `/api/files/{file_id}`.

## Estructura

```text
backend/
  server.py              API FastAPI
  requirements.txt       dependencias Python

frontend/
  src/                   app React
  public/                HTML público; no contiene assets del catálogo
  package.json           scripts y dependencias frontend
```

## Variables De Entorno

El backend carga `backend/.env`. Este archivo está ignorado por git y debe contener:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=safesteps_local
JWT_SECRET=change-me
ADMIN_EMAIL=admin@safesteps.app
ADMIN_PASSWORD=change-me
APP_NAME=safesteps
CORS_ORIGINS=http://localhost:3000

APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_BUCKET_ID=your-bucket-id
APPWRITE_API_KEY=your-server-api-key
```

El frontend carga `frontend/.env`:

```env
REACT_APP_BACKEND_URL=
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

En desarrollo local, `REACT_APP_BACKEND_URL` puede quedar vacío porque CRA usa el proxy de `frontend/package.json` hacia `http://127.0.0.1:8000`. En producción debe apuntar al host real del backend, por ejemplo:

```env
REACT_APP_BACKEND_URL=https://api.example.com
```

Esto es importante para imágenes: el frontend guarda rutas como `/api/files/home-hero-bg`, y `frontend/src/lib/backendFileUrl.js` las convierte al backend correcto cuando `REACT_APP_BACKEND_URL` está definido.

## Instalación

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

Frontend:

```powershell
cd frontend
yarn install
```

## Ejecutar En Local

Backend:

```powershell
cd backend
.\.venv\Scripts\uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

Frontend:

```powershell
cd frontend
yarn start
```

La app queda en `http://localhost:3000` y la API en `http://127.0.0.1:8000/api`.

## Panel Admin

Ruta:

```text
/admin
```

Credenciales iniciales:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

En startup, el backend crea o rota el usuario admin usando esas variables. Cambia los valores por credenciales reales antes de desplegar.

## Storage De Imágenes

Las imágenes del home, mockups y productos seed viven en Appwrite Storage. El frontend no llama Appwrite directamente; usa el backend:

```text
/api/files/{file_id}
```

IDs principales:

- `home-hero-bg`
- `home-model-safe-steps`
- `brand-safe-step-logo`
- `brand-safe-steps-portada`
- `mockups-mobile-reference`
- `mockups-desktop-reference`
- `prod-pulsera-champion`
- `prod-clips-cherry-crystal`
- `prod-collar-sweet-letter`
- `prod-pinza-lily-bloom`
- `prod-collar-year-tag`
- `prod-pulsera-little-bloom`
- `prod-clips-velvet-cherry`

Los uploads nuevos desde el admin también se suben a Appwrite. El backend guarda el `file_id` en Mongo y devuelve una URL interna `/api/files/{file_id}`.

## Datos Iniciales

Al arrancar, el backend:

- crea índices de MongoDB;
- crea o actualiza el usuario admin;
- asegura los productos seed;
- migra imágenes antiguas remotas o `/images/...` hacia rutas `/api/files/...`;
- crea settings globales si faltan.

## Comandos Útiles

Compilar frontend:

```powershell
cd frontend
yarn build
```

Validar sintaxis del backend:

```powershell
.\backend\.venv\Scripts\python.exe -m py_compile backend\server.py
```

Buscar rastros de servicios externos removidos:

```powershell
rg -n -i --hidden -g '!.git' -g '!frontend/node_modules' -g '!backend/.venv' "emergent|emergentagent|assets\.emergent|customer-assets|posthog" .
```

## Notas De Seguridad

- No versionar `.env`, API keys, credenciales ni tokens.
- Rotar la API key de Appwrite si alguna vez se comparte fuera del entorno seguro.
- Usar una `JWT_SECRET` fuerte en producción.
- Configurar `CORS_ORIGINS` con dominios específicos, no `*`, en producción.
