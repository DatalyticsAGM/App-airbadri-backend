/**
 * QA helper: verifica en MongoDB que un cambio se persistió.
 *
 * Caso de prueba actual:
 * - Busca el usuario por email en la colección `users`
 * - Valida que `fullName` y `avatarUrl` coincidan con lo esperado
 *
 * Uso:
 *   node qa-verify-db.js administrador@example.com "Admin Sistema QA" "https://example.com/qa-admin.jpg"
 */
const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const dns = require('node:dns')

const [, , email, expectedFullName, expectedAvatarUrl] = process.argv

if (!email || !expectedFullName || !expectedAvatarUrl) {
  console.error('Uso: node qa-verify-db.js <email> <expectedFullName> <expectedAvatarUrl>')
  process.exit(2)
}

// Carga .env desde la raíz del proyecto (igual que src/config/dotenv.ts).
dotenv.config({ path: path.resolve(__dirname, '.env') })

async function main() {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    console.error('Falta MONGO_URI en .env / entorno')
    process.exit(2)
  }

  // Atlas (mongodb+srv) depende de consultas DNS SRV. En algunas redes/firewalls se bloquea el DNS local.
  // Replicamos la misma estrategia del backend (src/config/db.ts) para aumentar la tasa de éxito.
  if (mongoUri.startsWith('mongodb+srv://')) {
    const raw = process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8'
    const servers = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (servers.length > 0) dns.setServers(servers)
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 10000,
  })

  try {
    const doc = await mongoose.connection.db.collection('users').findOne({ email: String(email).toLowerCase() })
    if (!doc) {
      console.error(`No existe usuario con email=${email} en colección users`)
      process.exit(1)
    }

    const actualFullName = doc.fullName
    const actualAvatarUrl = doc.avatarUrl

    console.log(JSON.stringify({ ok: true, email: doc.email, fullName: actualFullName, avatarUrl: actualAvatarUrl }, null, 2))

    const fullNameOk = actualFullName === expectedFullName
    const avatarOk = actualAvatarUrl === expectedAvatarUrl
    if (!fullNameOk || !avatarOk) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            mismatches: {
              fullName: { expected: expectedFullName, actual: actualFullName },
              avatarUrl: { expected: expectedAvatarUrl, actual: actualAvatarUrl },
            },
          },
          null,
          2
        )
      )
      process.exit(1)
    }
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((err) => {
  console.error('Error verificando DB:', err)
  process.exit(1)
})

