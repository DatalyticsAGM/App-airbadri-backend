import './config/dotenv'

import { createApp } from './app'
import { connectDb } from './config/db'
import { assertEnv, env } from './config/env'

async function main() {
  assertEnv()
  if (env.MONGO_URI) {
    await connectDb(env.MONGO_URI)
  } else {
    console.log('MongoDB desactivado: iniciando en modo memoria (sin persistencia).')
  }

  const app = createApp()

  app.listen(env.PORT, () => {
    console.log(`API lista en http://localhost:${env.PORT}`)
  })
}

main().catch((err) => {
  console.error('Error fatal al iniciar el servidor:', err)
  process.exit(1)
})

