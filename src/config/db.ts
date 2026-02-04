import mongoose from 'mongoose'
import dns from 'node:dns'

/** Timeouts ampliados para redes lentas o firewall. */
const CONNECT_OPTS = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 10000,
}

export async function connectDb(mongoUri: string) {
  // Atlas recomienda mongodb+srv. En algunas redes, el DNS local bloquea mongodb.net o consultas SRV.
  // Forzamos DNS públicos SOLO para esta ejecución (proceso actual) si la URI es SRV.
  if (mongoUri.startsWith('mongodb+srv://')) {
    const raw = process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8'
    const servers = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (servers.length > 0) {
      dns.setServers(servers)
    }
  }

  await mongoose.connect(mongoUri, CONNECT_OPTS)
  return mongoose.connection
}

