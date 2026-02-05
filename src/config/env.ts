type Env = {
  PORT: number
  MONGO_URI: string
  USE_MEMORY_ONLY: boolean
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  FRONTEND_ORIGIN: string
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
}

const DEFAULT_PORT = 3333 // mismo que la colección Postman (localhost:3333)

export const env: Env = {
  PORT: parseInt(process.env.PORT || String(DEFAULT_PORT), 10),
  MONGO_URI: process.env.MONGO_URI || '',
  USE_MEMORY_ONLY: process.env.USE_MEMORY_ONLY === 'true' || process.env.USE_MEMORY_ONLY === '1',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
}

export function assertEnv() {
  if (!env.JWT_SECRET) {
    throw new Error('Falta JWT_SECRET en el entorno')
  }
  if (!Number.isFinite(env.PORT)) {
    throw new Error('PORT inválido')
  }
  if (!env.USE_MEMORY_ONLY && !env.MONGO_URI) {
    throw new Error('Para trabajar con MongoDB define MONGO_URI en .env (o usa USE_MEMORY_ONLY=true para modo memoria)')
  }
}

