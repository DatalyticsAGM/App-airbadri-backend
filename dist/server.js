"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/dotenv");
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
async function main() {
    (0, env_1.assertEnv)();
    if (env_1.env.MONGO_URI) {
        await (0, db_1.connectDb)(env_1.env.MONGO_URI);
    }
    else {
        console.log('MongoDB desactivado: iniciando en modo memoria (sin persistencia).');
    }
    const app = (0, app_1.createApp)();
    app.listen(env_1.env.PORT, () => {
        console.log(`API lista en http://localhost:${env_1.env.PORT}`);
    });
}
main().catch((err) => {
    console.error('Error fatal al iniciar el servidor:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map