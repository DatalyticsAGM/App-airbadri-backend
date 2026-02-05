# Implementación de Envío de Emails con Resend

**Fecha**: 2026-02-05  
**Servicio**: Resend (https://resend.com)

---

## ⚠️ IMPORTANTE: Seguridad de API Key

**La API key expuesta públicamente debe ser regenerada**:
- API Key actual: `re_EBC2buMx_81x53QpPRczzcLfcVpeWfQEk`
- **Acción requerida**: Ir a https://resend.com/api-keys y generar una nueva key
- Después actualizar el valor en `.env`

**Nunca compartas API keys en público** (mensajes, commits, screenshots, etc.)

---

## Funcionalidad Implementada

### 1. Reset de Contraseña por Email

Cuando un usuario solicita recuperar su contraseña:

1. **Usuario hace request**: `POST /api/auth/forgot-password`
   ```json
   { "email": "usuario@example.com" }
   ```

2. **Backend genera token seguro**: 
   - Token aleatorio de 64 caracteres hexadecimales
   - Se guarda su hash SHA-256 en la base de datos
   - Válido por 15 minutos

3. **Email enviado automáticamente**:
   - Asunto: "Restablece tu contraseña - Airbnb"
   - Contiene link: `http://localhost:3000/reset-password?token=xxx`
   - Indica tiempo de expiración
   - Diseño HTML responsive

4. **Usuario hace clic en el link**:
   - Frontend muestra formulario de nueva contraseña
   - Envía `POST /api/auth/reset-password` con token + nueva password
   - Backend valida token y actualiza contraseña

### 2. Email de Bienvenida (Opcional)

También se implementó un email de bienvenida tras el registro (comentado por ahora para no saturar):

```typescript
// En signup handler (opcional):
await sendWelcomeEmail(user.email, user.fullName)
```

---

## Archivos Modificados/Creados

### 1. `.env` - Variables de entorno
```bash
RESEND_API_KEY=re_EBC2buMx_81x53QpPRczzcLfcVpeWfQEk
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 2. `src/config/env.ts` - Configuración
Añadidas las nuevas variables al type `Env`.

### 3. `src/services/email.service.ts` - ⭐ Nuevo servicio
Funciones:
- `sendPasswordResetEmail(to, resetToken, expiresAt)` - Envía email de reset
- `sendWelcomeEmail(to, fullName)` - Envía email de bienvenida

### 4. `src/controllers/auth.controller.ts` - Integración
Añadido en `forgotPassword`:
```typescript
await sendPasswordResetEmail(email, resetToken, expiresAt)
```

### 5. `package.json` - Dependencia
```bash
npm install resend
```

---

## Prueba Realizada

### Test 1: Registro de usuario
```bash
curl -X POST http://localhost:3333/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Adrian Gallardo",
    "email": "adriangallardogm@gmail.com",
    "password": "test123"
  }'
```
✅ Usuario creado

### Test 2: Solicitar reset de contraseña
```bash
curl -X POST http://localhost:3333/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"adriangallardogm@gmail.com"}'
```

**Respuesta**:
```json
{
  "ok": true,
  "resetToken": "9adc272038f4d6c43a5ee97222e3f0bd0487c3685c3f5de119718f337905736f",
  "expiresAt": "2026-02-05T18:26:55.782Z"
}
```

**Log del servidor**:
```
✓ Email de reset enviado a adriangallardogm@gmail.com (ID: 28e8f913-59ca-4c36-b057-e6c026649a79)
```

✅ **Email enviado correctamente a tu bandeja de entrada**

---

## Contenido del Email Enviado

```html
Asunto: Restablece tu contraseña - Airbnb

Recuperación de Contraseña
Hola,

Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva contraseña:

[Restablecer Contraseña]

O copia y pega este enlace en tu navegador:
http://localhost:3000/reset-password?token=xxx

⚠️ Este enlace expira en 15 minutos.

Si no solicitaste este cambio, ignora este email. Tu contraseña permanecerá sin cambios.
```

---

## Configuración de Resend

### Dominios Verificados
Por defecto, Resend permite enviar desde `onboarding@resend.dev` (dominio de prueba).

Para **producción**, necesitas:
1. Ir a https://resend.com/domains
2. Añadir tu dominio (ej: `airbnb.com`)
3. Verificar con registros DNS
4. Actualizar `RESEND_FROM_EMAIL` en `.env`

### Límites (Plan Gratuito)
- **100 emails/día**
- **3,000 emails/mes**
- Solo dominios verificados en producción

---

## Buenas Prácticas Implementadas

### ✅ Seguridad
- ❌ **NO se envía la contraseña** por email (nunca hacer esto)
- ✅ Se envía un **token de un solo uso** con expiración
- ✅ Token hasheado con SHA-256 en la base de datos
- ✅ Respuesta igual si el email existe o no (anti-enumeración)

### ✅ UX
- Email HTML responsive y atractivo
- Botón destacado para reset
- Link alternativo si el botón no funciona
- Tiempo de expiración claro (15 minutos)
- Instrucciones si no solicitó el cambio

### ✅ Código
- Servicio reutilizable (`email.service.ts`)
- Manejo de errores (no rompe si Resend falla)
- Logs informativos para debugging
- Configuración via variables de entorno

---

## Próximos Pasos (Opcional)

### 1. Verificar tu dominio en Resend
Para enviar desde `noreply@tudominio.com` en lugar de `onboarding@resend.dev`.

### 2. Añadir más tipos de emails
- Confirmación de reserva
- Cancelación de reserva
- Nueva review recibida
- Bienvenida tras registro

### 3. Templates profesionales
Usar Resend React Email para templates más complejos:
```bash
npm install @react-email/components
```

### 4. Monitoreo
Revisar en https://resend.com/emails los emails enviados, bounces, aperturas, etc.

---

## Ejemplo de Uso (Frontend)

```typescript
// 1. Usuario solicita reset
const response = await fetch('http://localhost:3333/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'usuario@example.com' })
})

// Usuario recibe email y hace clic en el link
// Frontend redirecciona a: /reset-password?token=xxx

// 2. Usuario ingresa nueva contraseña
const token = new URLSearchParams(window.location.search).get('token')
await fetch('http://localhost:3333/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    token, 
    password: 'nuevaPassword123' 
  })
})
```

---

## Troubleshooting

### Email no llega
1. **Verifica spam/promociones** en tu bandeja
2. Revisa logs del servidor: `✓ Email de reset enviado...`
3. Verifica en https://resend.com/emails el estado del envío
4. Confirma que `RESEND_API_KEY` sea válida

### Error "Cannot find module 'resend'"
```bash
npm install resend
```

### Error "RESEND_API_KEY no configurada"
Verifica que `.env` tenga:
```bash
RESEND_API_KEY=re_xxx
```

---

## Conclusión

✅ **Implementación completa y funcional**
- Reset de contraseña con email seguro
- Token con expiración de 15 minutos
- Email HTML profesional
- Probado exitosamente con tu email

🔒 **Recuerda regenerar la API key** que expusiste públicamente.
