"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const errorHandler_1 = require("./middlewares/errorHandler");
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // CORS: en dev permite tu frontend; si no se define, deja abierto.
    app.use((0, cors_1.default)({
        origin: env_1.env.FRONTEND_ORIGIN || true,
        credentials: true,
    }));
    // Home: info rápida de la API (útil para comprobar que está viva)
    app.get('/', (_req, res) => {
        res.json({
            message: '🚀 Airbnb Backend API funcionando',
            version: '1.0.0',
            endpoints: {
                auth: '/api/auth',
                users: '/api/users',
                properties: '/api/properties',
                bookings: '/api/bookings',
                reviews: '/api/reviews',
                notifications: '/api/notifications',
                favorites: '/api/favorites',
                host: '/api/host',
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                forgotPassword: 'POST /api/auth/forgot-password',
                resetPassword: 'POST /api/auth/reset-password',
                verify: 'GET /api/auth/verify',
            },
        });
    });
    app.get('/health', (_req, res) => {
        res.json({ ok: true });
    });
    (0, routes_1.registerRoutes)(app);
    // 404 simple
    app.use((_req, res) => {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    });
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map