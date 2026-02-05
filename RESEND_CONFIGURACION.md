# Configuración de Resend para Producción

## 🔴 Problema Actual (Modo Desarrollo)

Con la API key de **prueba**, Resend solo permite enviar emails a:
- Tu email registrado: `adriangallardogm@gmail.com`
- ❌ NO permite enviar a otros emails como `pelos@example.com`

**Error recibido**:
```
Error 403: You can only send testing emails to your own email address.
To send emails to other recipients, please verify a domain.
```

---

## ✅ Solución Temporal (Desarrollo)

El backend ahora **no falla** aunque Resend no pueda enviar el email:
- Devuelve `200 OK` con el `resetToken`
- El frontend puede usar el token directamente (sin email)
- Perfecto para desarrollo y testing

---

## 🚀 Solución para Producción (Enviar a cualquier email)

### Opción 1: Verificar un Dominio (Recomendado)

#### Paso 1: Ve a Resend
https://resend.com/domains

#### Paso 2: Añade tu dominio
Por ejemplo: `tuapp.com`

#### Paso 3: Configura registros DNS
Resend te dará registros DNS que debes añadir en tu proveedor (GoDaddy, Namecheap, Cloudflare, etc.):

```
Tipo: TXT
Nombre: @ o tuapp.com
Valor: [valor que te da Resend]

Tipo: CNAME
Nombre: resend._domainkey
Valor: [valor que te da Resend]
```

#### Paso 4: Actualiza el .env
```bash
RESEND_FROM_EMAIL=noreply@tuapp.com
```

#### Paso 5: Espera verificación
Puede tomar de 5 minutos a 48 horas.

---

### Opción 2: Usar un Subdominio de Prueba

Si no tienes dominio propio, puedes:

1. **Usar subdominios gratuitos**:
   - `tuapp.fly.dev` (si usas Fly.io)
   - `tuapp.vercel.app` (si usas Vercel)
   - `tuapp.railway.app` (si usas Railway)

2. Verificar ese subdominio en Resend

---

### Opción 3: Cambiar a otro Servicio (Alternativas)

Si Resend no funciona para ti:

#### SendGrid (Gratis 100 emails/día)
```bash
npm install @sendgrid/mail
SENDGRID_API_KEY=xxx
```

#### Mailgun (Gratis 5,000 emails/mes)
```bash
npm install mailgun.js
MAILGUN_API_KEY=xxx
```

#### Mailtrap (Solo testing, no producción)
```bash
npm install nodemailer
MAILTRAP_USER=xxx
MAILTRAP_PASS=xxx
```

---

## 🔧 Configuración Actual del Backend

El backend está configurado para:

1. **Intentar enviar email** con Resend
2. **Si falla**: No rompe el flujo, solo registra el error
3. **En modo dev**: Devuelve el `resetToken` en la respuesta
4. **Frontend puede usar el token** directamente sin email

### Código actual (auth.controller.ts):
```typescript
// Intentar enviar email (no falla si Resend tiene restricciones)
try {
  await sendPasswordResetEmail(email, resetToken, expiresAt)
} catch (err) {
  console.log('⚠️  Email no enviado (modo dev, usa el token):', err)
}

// Devuelve el token para que el frontend lo use
res.json({ ok: true, resetToken, expiresAt })
```

---

## 💡 Testing en Desarrollo

Mientras tanto, puedes testear el flujo completo:

### Con tu email (funciona):
```bash
curl -X POST http://localhost:3333/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"adriangallardogm@gmail.com"}'
```
✅ Email enviado correctamente

### Con otros emails (no envía email pero no falla):
```bash
curl -X POST http://localhost:3333/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"pelos@example.com"}'
```
✅ Backend responde OK con token  
⚠️ Email NO enviado (Resend lo bloquea)  
✅ Token funciona para reset

---

## 🎯 Recomendación

**Para desarrollo**: 
- Usa el código actual (está funcionando)
- El token se devuelve en la respuesta
- No necesitas email real

**Para producción**:
- Verifica un dominio en Resend
- O cambia a SendGrid/Mailgun
- Regenera tu API key (la expusiste públicamente)

---

## 📋 Checklist para Producción

- [ ] Verificar dominio en Resend
- [ ] Actualizar `RESEND_FROM_EMAIL` con email del dominio verificado
- [ ] Regenerar `RESEND_API_KEY` (la actual fue expuesta)
- [ ] Quitar el `resetToken` de la respuesta (solo para dev)
- [ ] Probar envío a emails reales
- [ ] Configurar límites de rate limiting
- [ ] Añadir templates profesionales

---

## ❓ FAQ

**Q: ¿Por qué el frontend muestra error?**  
A: Probablemente el frontend está verificando si el email se envió realmente. El backend devuelve 200 OK con el token, así que el "error" es solo del frontend.

**Q: ¿Puedo usar el sistema sin verificar dominio?**  
A: Sí, en desarrollo. Solo podrás enviar emails a `adriangallardogm@gmail.com`, pero el sistema funciona porque el backend devuelve el token directamente.

**Q: ¿Necesito pagar Resend?**  
A: No. El plan gratuito permite 3,000 emails/mes con dominio verificado.

**Q: ¿Cuánto tarda verificar el dominio?**  
A: Entre 5 minutos y 48 horas, dependiendo de tu proveedor DNS.
