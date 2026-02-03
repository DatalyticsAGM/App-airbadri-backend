"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.assertEnv = assertEnv;
exports.env = {
    PORT: parseInt(process.env.PORT || '3333', 10),
    MONGO_URI: process.env.MONGO_URI || '',
    USE_MEMORY_ONLY: process.env.USE_MEMORY_ONLY === 'true' || process.env.USE_MEMORY_ONLY === '1',
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '',
};
function assertEnv() {
    if (!exports.env.JWT_SECRET) {
        throw new Error('Falta JWT_SECRET en el entorno');
    }
    if (!Number.isFinite(exports.env.PORT)) {
        throw new Error('PORT inválido');
    }
}
//# sourceMappingURL=env.js.map