import { createApp } from './app'
import { connectDb } from './config/db'
import { assertEnv, env } from './config/env'

async function main() {
  assertEnv()
  await connectDb(env.MONGO_URI)

  const app = createApp()

  app.listen(env.PORT, () => {
    console.log(`API lista en http://localhost:${env.PORT}`)
  })
}

main().catch((err) => {
  console.error('Error fatal al iniciar el servidor:', err)
  process.exit(1)
})

