"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
const mongoose_1 = __importDefault(require("mongoose"));
const node_dns_1 = __importDefault(require("node:dns"));
/** Timeouts ampliados para redes lentas o firewall. */
const CONNECT_OPTS = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 10000,
};
async function connectDb(mongoUri) {
    // Atlas recomienda mongodb+srv. En algunas redes, el DNS local bloquea mongodb.net o consultas SRV.
    // Forzamos DNS públicos SOLO para esta ejecución (proceso actual) si la URI es SRV.
    if (mongoUri.startsWith('mongodb+srv://')) {
        const raw = process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8';
        const servers = raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (servers.length > 0) {
            node_dns_1.default.setServers(servers);
        }
    }
    await mongoose_1.default.connect(mongoUri, CONNECT_OPTS);
    return mongoose_1.default.connection;
}
//# sourceMappingURL=db.js.map