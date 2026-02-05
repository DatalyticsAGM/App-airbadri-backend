/**
 * Servicio de envío de emails usando Resend.
 *
 * Proporciona funciones para enviar emails transaccionales (reset de contraseña, bienvenida, etc.).
 */
import { Resend } from 'resend'
import { env } from '../config/env'

let resendClient: Resend | null = null

/**
 * Obtiene o crea una instancia del cliente de Resend.
 */
function getResendClient(): Resend {
  if (!resendClient) {
    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno')
    }
    resendClient = new Resend(env.RESEND_API_KEY)
  }
  return resendClient
}

/**
 * Envía un email de reset de contraseña con un link seguro.
 *
 * @param to - Email del destinatario
 * @param resetToken - Token de reset generado
 * @param expiresAt - Fecha de expiración del token
 */
export async function sendPasswordResetEmail(to: string, resetToken: string, expiresAt: Date) {
  const resend = getResendClient()

  // URL del frontend para reset (ajusta según tu configuración)
  const resetUrl = `${env.FRONTEND_ORIGIN}/reset-password?token=${resetToken}`

  // Calcula minutos restantes de validez
  const minutesValid = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60))

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Recuperación de Contraseña</h2>
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #FF5A5F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Restablecer Contraseña
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        O copia y pega este enlace en tu navegador:<br>
        <a href="${resetUrl}" style="color: #FF5A5F;">${resetUrl}</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        ⚠️ Este enlace expira en <strong>${minutesValid} minutos</strong>.
      </p>
      <p style="color: #666; font-size: 14px;">
        Si no solicitaste este cambio, ignora este email. Tu contraseña permanecerá sin cambios.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        Airbnb Backend - Sistema de Gestión
      </p>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: 'Restablece tu contraseña - Airbnb',
      html,
    })

    if (result.error) {
      console.error(`❌ Error de Resend al enviar a ${to}:`, result.error)
      return null
    }

    console.log(`✓ Email de reset enviado a ${to} (ID: ${result.data?.id})`)
    return result
  } catch (error) {
    console.error(`❌ Error enviando email de reset a ${to}:`, error)
    // No lanzamos error para no romper el flujo; el usuario igual recibe el token en dev
    return null
  }
}

/**
 * Envía un email de bienvenida tras el registro.
 *
 * @param to - Email del destinatario
 * @param fullName - Nombre completo del usuario
 */
export async function sendWelcomeEmail(to: string, fullName: string) {
  const resend = getResendClient()

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">¡Bienvenido a Airbnb!</h2>
      <p>Hola <strong>${fullName}</strong>,</p>
      <p>Gracias por registrarte. Tu cuenta ha sido creada exitosamente.</p>
      <p>Ya puedes empezar a explorar propiedades y hacer reservas.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.FRONTEND_ORIGIN}" 
           style="background-color: #FF5A5F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Ir a la App
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        Airbnb Backend - Sistema de Gestión
      </p>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: '¡Bienvenido a Airbnb!',
      html,
    })

    console.log(`✓ Email de bienvenida enviado a ${to} (ID: ${result.data?.id})`)
    return result
  } catch (error) {
    console.error('Error enviando email de bienvenida:', error)
    return null
  }
}
