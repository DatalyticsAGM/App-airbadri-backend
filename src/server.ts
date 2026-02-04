import './config/dotenv'

import { connectDb } from './config/db'
import { assertEnv, env } from './config/env'

async function main() {
  assertEnv()

  if (env.USE_MEMORY_ONLY) {
    console.log('Backend en modo memoria (USE_MEMORY_ONLY=true). Para MongoDB: USE_MEMORY_ONLY=false y MONGO_URI.')
  } else {
    if (!env.MONGO_URI) {
      console.error('Para trabajar con MongoDB define MONGO_URI en .env (y no uses USE_MEMORY_ONLY o ponlo en false).')
      process.exit(1)
    }
    try {
      await connectDb(env.MONGO_URI)
    } catch (err) {
      console.error('No se pudo conectar a MongoDB.', err)
      process.exit(1)
    }
  }

  // Cargar app después de conectar para que los repositorios usen MongoDB cuando esté conectado.
  const { createApp } = await import('./app')
  const app = createApp()

  app.listen(env.PORT, () => {
    console.log(`API lista en http://localhost:${env.PORT}`)
    if (!env.USE_MEMORY_ONLY) console.log('Persistencia: MongoDB')
  })
}

main().catch((err) => {
  console.error('Error fatal al iniciar el servidor:', err)
  process.exit(1)
})

