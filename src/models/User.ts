/**
 * Módulo User (modelo).
 *
 * Define el esquema y el tipo del documento de usuario en la capa Model del MVC.
 * Usado por repositories/mongo cuando la persistencia es MongoDB.
 * El tipo UserDoc es solo interno (no se exporta).
 */
import mongoose, { Schema } from 'mongoose'

/**
 * Tipo del documento de usuario tal como se persiste (MongoDB o representación equivalente).
 * Contiene los datos sensibles (passwordHash) y los usados para reset de contraseña.
 *
 * @property _id - Identificador único del documento (ObjectId en MongoDB).
 * @property fullName - Nombre completo del usuario.
 * @property email - Correo electrónico (único, se guarda en minúsculas).
 * @property passwordHash - Contraseña hasheada con bcrypt (nunca se devuelve en respuestas públicas).
 * @property resetPasswordTokenHash - Hash del token de restablecimiento de contraseña, si existe.
 * @property resetPasswordExpiresAt - Fecha de expiración del token de reset.
 * @property createdAt - Fecha de creación (timestamps).
 * @property updatedAt - Fecha de última actualización (timestamps).
 */
type UserDoc = {
  _id: mongoose.Types.ObjectId
  fullName: string
  email: string
  avatarUrl?: string
  passwordHash: string
  resetPasswordTokenHash?: string
  resetPasswordExpiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserDoc>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatarUrl: { type: String, required: false },
    passwordHash: { type: String, required: true },
    resetPasswordTokenHash: { type: String, required: false },
    resetPasswordExpiresAt: { type: Date, required: false },
  },
  { timestamps: true }
)

/**
 * Modelo de Mongoose para la colección de usuarios.
 * Se usa en repositories/mongo cuando la persistencia es MongoDB.
 *
 * @example
 * const user = await User.findOne({ email: 'a@b.com' })
 * const created = await User.create({ fullName: 'Juan', email: 'j@b.com', passwordHash: '...' })
 */
export const User = mongoose.model<UserDoc>('User', userSchema)
