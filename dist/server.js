"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/dotenv");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
async function main() {
    (0, env_1.assertEnv)();
    if (env_1.env.USE_MEMORY_ONLY) {
        console.log('Backend en modo memoria (USE_MEMORY_ONLY=true). Para MongoDB: USE_MEMORY_ONLY=false y MONGO_URI.');
    }
    else {
        if (!env_1.env.MONGO_URI) {
            console.error('Para trabajar con MongoDB define MONGO_URI en .env (y no uses USE_MEMORY_ONLY o ponlo en false).');
            process.exit(1);
        }
        try {
            await (0, db_1.connectDb)(env_1.env.MONGO_URI);
        }
        catch (err) {
            console.error('No se pudo conectar a MongoDB.', err);
            process.exit(1);
        }
    }
    // Cargar app después de conectar para que los repositorios usen MongoDB cuando esté conectado.
    const { createApp } = await Promise.resolve().then(() => __importStar(require('./app')));
    const app = createApp();
    app.listen(env_1.env.PORT, () => {
        console.log(`API lista en http://localhost:${env_1.env.PORT}`);
        if (!env_1.env.USE_MEMORY_ONLY)
            console.log('Persistencia: MongoDB');
    });
}
main().catch((err) => {
    console.error('Error fatal al iniciar el servidor:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map