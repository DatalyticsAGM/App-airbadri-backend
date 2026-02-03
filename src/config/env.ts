type Env = {
  PORT: number
  MONGO_URI: string
  USE_MEMORY_ONLY: boolean
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  FRONTEND_ORIGIN: string
}

export const env: Env = {
  PORT: parseInt(process.env.PORT || '3333', 10),
  MONGO_URI: process.env.MONGO_URI || '',
  USE_MEMORY_ONLY: process.env.USE_MEMORY_ONLY === 'true' || process.env.USE_MEMORY_ONLY === '1',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '',
}

export function assertEnv() {
  if (!env.JWT_SECRET) {
    throw new Error('Falta JWT_SECRET en el entorno')
  }
  if (!Number.isFinite(env.PORT)) {
    throw new Error('PORT inválido')
  }
}

