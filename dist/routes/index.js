"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const auth_routes_1 = require("./auth.routes");
function registerRoutes(app) {
    app.use('/api/auth', (0, auth_routes_1.authRoutes)());
}
//# sourceMappingURL=index.js.map