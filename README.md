<div align="center">

# ☕ Applin & Grain

**Tienda de café de especialidad · Frontend**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Entra ID](https://img.shields.io/badge/Microsoft_Entra-MSAL-0078D4?logo=microsoft&logoColor=white)

</div>

## 🧭 Arquitectura

El front **solo habla con el BFF** (`bff-api`, puerto 8088). El BFF habla con catálogo, órdenes y RabbitMQ.

```
Front (React · 5173) ──/api──▶ BFF :8088 ──▶ ms-catalog :8086
                                         ├─▶ ms-orders  :8087 ──▶ RabbitMQ ──▶ ms-notify (correo + boleta PDF)
```

## 🚀 Inicio rápido

```powershell
npm install
copy .env.example .env      # y completa BFF_URL
npm run dev                 # http://localhost:5173
```

Copia tu logo a `public/logo.png`.

## ⚙️ Configuración (`.env`)

| Variable | Para qué sirve |
|---|---|
| `BFF_URL` | A dónde apunta el proxy de Vite en desarrollo (ej. `http://IP_ELASTICA:8088`) |
| `VITE_API_URL` | Base de las peticiones. `/api` usa el proxy de Vite |
| `VITE_AUTH_ENABLED` | `false` = sin login (pruebas) · `true` = login con Microsoft |
| `VITE_ENTRA_CLIENT_ID` | Client ID del registro de la app en Entra |
| `VITE_ENTRA_AUTHORITY` | `common` = cuentas de la organización + personales |
| `VITE_API_SCOPE` | Scope de la API, ej. `api://<client-id>/access_as_user` |
| `VITE_ADMIN_ROLE` | Nombre del rol de administrador (por defecto `Admin`) |

Vite lee `.env` solo al arrancar: reinicia `npm run dev` tras cambiarlo.

## 🔌 Endpoints que usa (vía BFF)

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/catalog/products` | Catálogo |
| `GET` | `/api/catalog/products/{id}` | Detalle y revalidación de stock |
| `POST` | `/api/orders` | Crear pedido (`productoId` + `cantidad`; el BFF pone el precio) |

## 🛒 Flujo de compra

1. El carrito valida stock en pantalla.
2. "Continuar" abre el formulario (nombre, correo, RUT, dirección). Con login activo, exige sesión.
3. "Confirmar pedido" revalida stock con el servidor y crea el pedido.
4. Si se creó: se vacía el carrito y se muestra el número. Si falla: el carrito se mantiene y se muestra el motivo.

## 🗂️ Estructura

```
src/
├── components/  Header · ProductCard · Cart · CheckoutForm · AuthButton
├── context/     CartContext · ToastContext · AuthContext (MSAL)
├── pages/       Home · ProductDetail
├── services/    http (axios + token) · catalogService · orderService
├── hooks/       useProducts · useTheme
└── utils/       format · rut
```

## 🛠️ Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| "No pudimos conectar con el servidor" | BFF apagado, IP o puerto incorrectos | Revisa `BFF_URL` y el Security Group (8088) |
| 404 en productos | Ruta distinta a `/api/catalog/products` | Ajusta `catalogService.js` |
| "RUT no válido" | Dígito verificador incorrecto | Prueba con 12.345.678-5 |
| 401 / 403 | Sesión vencida o sin rol | Vuelve a iniciar sesión / revisa el rol |
| Página HTTPS no carga datos | El BFF es HTTP (contenido mixto) | Usa la API Gateway HTTPS con CORS |
