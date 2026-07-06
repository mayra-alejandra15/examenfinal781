# SecureWallet - Examen Final INF781

## Descripción del proyecto

SecureWallet es una aplicación web de billetera digital desarrollada como proyecto final de la materia INF781.

El sistema permite registrar usuarios, iniciar sesión con verificación en dos pasos MFA/TOTP usando Google Authenticator, consultar saldo, realizar recargas, ejecutar transferencias seguras, revisar historial de movimientos y administrar usuarios desde un panel de administrador.

El proyecto está dividido en dos partes:

```text
exam-final/
├── backend/
└── frontend/
```

---

## Tecnologías utilizadas

### Backend

- NestJS
- TypeScript
- MySQL
- TypeORM
- JWT
- Refresh Token
- bcrypt
- Google Authenticator MFA/TOTP
- Helmet
- CORS
- Rate Limit
- class-validator

### Frontend

- React
- Vite
- JavaScript
- Axios
- React Router DOM
- CSS

### Base de datos

- MySQL

---

## Funcionalidades principales

- Registro de usuarios con CAPTCHA.
- Creación automática de billetera con saldo inicial 0.00 Bs.
- Login con correo y contraseña.
- Verificación MFA/TOTP con Google Authenticator.
- Generación de QR para configurar MFA.
- Login seguro con código de 6 dígitos.
- Consulta de perfil y saldo.
- Recarga de saldo.
- Transferencias entre usuarios.
- Confirmación de transferencias.
- Transferencias mayores a 500 Bs con código TOTP.
- Historial de movimientos.
- Panel administrador.
- Bloqueo y desbloqueo de usuarios.
- Bitácora de auditoría.
- Refresh token con rotación.
- Logout con invalidación de sesión.
- Rate limiting en login y transferencias.
- Protección contra IDOR/BOLA.
- Validaciones estrictas con DTOs.
- Rechazo de campos no esperados.
- Uso de UUID como identificador público.

---

## Requisitos previos

Antes de ejecutar el proyecto se debe tener instalado:

- Node.js
- npm
- MySQL
- Git
- Google Authenticator en el celular

---

## Instalación del proyecto

Clonar el repositorio:

```bash
git clone https://github.com/mayra-alejandra15/examenfinal781.git
```

Ingresar a la carpeta principal:

```bash
cd examenfinal781
```

---

# Configuración del Backend

Ingresar a la carpeta del backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo `.env` a partir del archivo de ejemplo:

```bash
copy .env.example .env
```

En Linux o Mac:

```bash
cp .env.example .env
```

---

## Variables de entorno de ejemplo

Archivo:

```text
backend/.env.example
```

Contenido:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=securewalletex

JWT_SECRET=CAMBIAR_EN_PRODUCCION
JWT_EXPIRES_IN=15m

REFRESH_SECRET=CAMBIAR_EN_PRODUCCION
REFRESH_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Importante:

El archivo `.env` real no debe subirse al repositorio porque contiene variables sensibles.

---

## Crear la base de datos

En MySQL ejecutar:

```sql
CREATE DATABASE securewalletex;
```

Verificar que en el archivo `.env` el nombre de la base de datos sea:

```env
DB_DATABASE=securewalletex
```

---

## Ejecutar backend

Desde la carpeta `backend`:

```bash
npm run start:dev
```

El backend se ejecuta en:

```text
http://localhost:3000/api/v1
```

---

# Configuración del Frontend

Abrir otra terminal y entrar a la carpeta del frontend:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Ejecutar el frontend:

```bash
npm run dev
```

El frontend se ejecuta en:

```text
http://localhost:5173
```

---

# Usuarios semilla

El proyecto incluye usuarios de prueba para la defensa.

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | admin@securewallet.com | Admin@123 |
| USER | user1@securewallet.com | User@12345 |
| USER | user2@securewallet.com | User@12345 |

---

## Ejecutar seeders

Desde la carpeta `backend`:

```bash
npm run seed
```

Este comando crea:

- 1 usuario administrador.
- 2 usuarios normales.
- Billeteras asociadas.
- Saldos iniciales de prueba.

---

# MFA/TOTP con Google Authenticator

El sistema utiliza verificación en dos pasos con Google Authenticator.

## Flujo de MFA

1. El usuario ingresa su correo y contraseña.
2. Si todavía no tiene MFA configurado, el sistema muestra un código QR.
3. El usuario escanea el QR con Google Authenticator.
4. Google Authenticator genera un código de 6 dígitos.
5. El usuario ingresa el código TOTP en el login.
6. Si el código es válido, el sistema entrega el accessToken y refreshToken.
7. En próximos inicios de sesión solo se pedirá correo, contraseña y código MFA.

---

## Reiniciar MFA de un usuario

Si se desea volver a mostrar el QR de MFA para un usuario, ejecutar en MySQL:

```sql
USE securewalletex;

UPDATE users
SET mfaEnabled = 0,
    mfaSecret = NULL
WHERE email = 'admin@securewallet.com';
```

También se puede usar con otro usuario:

```sql
USE securewalletex;

UPDATE users
SET mfaEnabled = 0,
    mfaSecret = NULL
WHERE email = 'user1@securewallet.com';
```

---

# Endpoints principales

## Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/auth/captcha` | Genera CAPTCHA |
| POST | `/api/v1/auth/register` | Registro de usuario |
| POST | `/api/v1/auth/login` | Login con correo y contraseña |
| POST | `/api/v1/auth/mfa/login` | Login con MFA/TOTP |
| POST | `/api/v1/auth/refresh` | Renovar token |
| POST | `/api/v1/auth/logout` | Cerrar sesión |

---

## Usuario y billetera

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/me` | Ver perfil del usuario autenticado |
| GET | `/api/v1/wallet` | Ver billetera del usuario autenticado |
| POST | `/api/v1/wallet/topup` | Recargar saldo |

---

## Transferencias

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/v1/transfers` | Crear transferencia |
| POST | `/api/v1/transfers/:uuid/confirm` | Confirmar transferencia |

Para crear transferencias se debe enviar el header:

```text
Idempotency-Key: clave-unica-de-la-operacion
```

Ejemplo:

```text
Idempotency-Key: transferencia-001
```

---

## Historial

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/transactions` | Ver historial de movimientos |

---

## Administración

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/v1/admin/users` | Listar usuarios |
| PATCH | `/api/v1/admin/users/:uuid/block` | Bloquear o desbloquear usuario |
| GET | `/api/v1/admin/audit-logs` | Ver auditoría |

---

# Ejemplos de uso en Postman

## Obtener CAPTCHA

```http
GET http://localhost:3000/api/v1/auth/captcha
```

Respuesta:

```json
{
  "captchaId": "uuid",
  "question": "¿Cuánto es 4 + 5?",
  "expiresIn": 300
}
```

---

## Registrar usuario

```http
POST http://localhost:3000/api/v1/auth/register
```

Body:

```json
{
  "fullName": "Usuario Prueba",
  "ci": "12345678",
  "email": "usuario@test.com",
  "phone": "71234567",
  "password": "Usuario@12345",
  "captchaId": "CAPTCHA_ID",
  "captchaAnswer": "RESPUESTA"
}
```

---

## Login normal

```http
POST http://localhost:3000/api/v1/auth/login
```

Body:

```json
{
  "email": "admin@securewallet.com",
  "password": "Admin@123"
}
```

Si el usuario no tiene MFA configurado, devuelve QR y código manual.

---

## Login MFA

```http
POST http://localhost:3000/api/v1/auth/mfa/login
```

Body:

```json
{
  "email": "admin@securewallet.com",
  "password": "Admin@123",
  "code": "123456"
}
```

El código debe ser el generado por Google Authenticator.

---

## Consultar perfil

```http
GET http://localhost:3000/api/v1/me
```

Header:

```text
Authorization: Bearer TU_ACCESS_TOKEN
```

---

## Recargar saldo

```http
POST http://localhost:3000/api/v1/wallet/topup
```

Header:

```text
Authorization: Bearer TU_ACCESS_TOKEN
```

Body:

```json
{
  "amount": 100
}
```

---

## Crear transferencia

```http
POST http://localhost:3000/api/v1/transfers
```

Headers:

```text
Authorization: Bearer TU_ACCESS_TOKEN
Idempotency-Key: transferencia-prueba-001
```

Body:

```json
{
  "destinatario": "user1@securewallet.com",
  "monto": 50,
  "descripcion": "Pago de prueba"
}
```

---

## Confirmar transferencia

```http
POST http://localhost:3000/api/v1/transfers/UUID_TRANSFERENCIA/confirm
```

Header:

```text
Authorization: Bearer TU_ACCESS_TOKEN
```

Body si no requiere MFA:

```json
{}
```

Body si requiere TOTP:

```json
{
  "totpCode": "123456"
}
```

---

# Seguridad implementada

## Contraseñas seguras

Las contraseñas se almacenan usando bcrypt con factor de costo 12.

No se almacena texto plano, MD5 ni SHA1.

Ejemplo esperado en base de datos:

```text
$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## MFA/TOTP

El sistema implementa MFA mediante Google Authenticator.

El secreto TOTP no se expone en respuestas normales como perfil, billetera, historial o administración.

El QR y código manual solo se muestran durante la configuración inicial del MFA.

---

## JWT y Refresh Token

El sistema usa:

- AccessToken con expiración corta.
- RefreshToken con rotación.
- Invalidación de refresh token en logout.

---

## BOLA / IDOR

El usuario no puede consultar datos de otros usuarios manipulando IDs.

Los endpoints de perfil, billetera e historial usan el usuario autenticado desde el JWT:

```text
req.user.id
```

No se permite consultar saldo o movimientos por IDs internos enviados en URL o body.

Además, se usan UUID como identificadores públicos.

---

## Validación estricta

El backend usa `class-validator` y `ValidationPipe` con:

```ts
whitelist: true
forbidNonWhitelisted: true
transform: true
```

Esto permite:

- Validar tipos.
- Validar formatos.
- Validar rangos.
- Rechazar campos no esperados.
- Evitar mass assignment.

Ejemplo de campos rechazados:

```json
{
  "role": "ADMIN",
  "balance": 999999,
  "userId": 1
}
```

---

## Protección contra doble cobro

Las transferencias usan:

- Transacción de base de datos.
- Bloqueo pesimista equivalente a `SELECT FOR UPDATE`.
- Validación de saldo dentro de la transacción.
- Header `Idempotency-Key`.

Esto evita:

- Condiciones de carrera.
- Saldos negativos.
- Doble cobro por reintentos.

---

## CORS y Helmet

El backend tiene CORS restringido al frontend:

```text
http://localhost:5173
```

También usa Helmet para agregar cabeceras de seguridad HTTP.

---

## Rate Limiting

El sistema limita:

- Login: máximo 5 intentos por minuto.
- Transferencias: máximo 10 solicitudes por minuto.

---

## Manejo de errores

Los mensajes de error son genéricos y no exponen:

- Consultas SQL.
- Stack traces.
- Hashes.
- Secretos.
- Información interna sensible.

---

## Tokens en frontend

El sistema utiliza:

```text
Authorization: Bearer
```

Los tokens se almacenan en `localStorage` por simplicidad académica.

Riesgo reconocido:

- Si existiera XSS, un atacante podría intentar leer `localStorage`.

Mitigaciones aplicadas:

- React escapa la salida por defecto.
- No se usa `innerHTML`.
- No se usa `dangerouslySetInnerHTML`.
- Helmet agrega cabeceras de seguridad.
- AccessToken con expiración corta.
- Refresh token con rotación.
- Logout invalida la sesión.

---

# Pruebas recomendadas para defensa

## Autenticación

- Registrar usuario.
- Login con contraseña correcta.
- Login con contraseña incorrecta.
- Login con usuario inexistente.
- Configurar MFA.
- Login con código MFA correcto.
- Login con código MFA incorrecto.
- Logout.

---

## Seguridad

- Intentar registrar usuario con contraseña débil.
- Intentar enviar `role: ADMIN` en el registro.
- Intentar recargar saldo con monto negativo.
- Intentar transferir sin `Idempotency-Key`.
- Repetir transferencia con la misma `Idempotency-Key`.
- Confirmar dos veces la misma transferencia.
- Intentar ver datos de otro usuario.
- Entrar a rutas ADMIN con usuario normal.
- Verificar que las respuestas no muestran `passwordHash` ni `mfaSecret`.

---

## Transferencias

- Recargar saldo.
- Crear transferencia.
- Confirmar transferencia.
- Transferencia mayor a 500 Bs con TOTP.
- Verificar historial.
- Verificar saldo del emisor.
- Verificar saldo del receptor.

---

# Comandos útiles

## Ejecutar backend

```bash
cd backend
npm run start:dev
```

## Ejecutar frontend

```bash
cd frontend
npm run dev
```

## Ejecutar seeders

```bash
cd backend
npm run seed
```

## Ver estado de Git

```bash
git status
```

## Subir cambios

```bash
git add .
git commit -m "Proyecto final SecureWallet"
git push origin main
```

---

# Autor

Proyecto desarrollado para el examen final de INF781.

Estudiantes: 
JHON CALIXTO MAMANI MAMANI
MAYRA ALEJANDRA MAMANI QUISPE
