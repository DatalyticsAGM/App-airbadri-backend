"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const express_1 = require("express");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const auth_1 = require("../middlewares/auth");
const auth_controller_1 = require("../controllers/auth.controller");
function authRoutes() {
    const router = (0, express_1.Router)();
    router.post('/signup', (0, asyncHandler_1.asyncHandler)(auth_controller_1.signup));
    // Alias para compatibilidad (UI/preview): "register" = signup
    router.post('/register', (0, asyncHandler_1.asyncHandler)(auth_controller_1.signup));
    router.post('/login', (0, asyncHandler_1.asyncHandler)(auth_controller_1.login));
    router.get('/me', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(auth_controller_1.me));
    // Alias para compatibilidad (UI/preview): "verify" = me
    router.get('/verify', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(auth_controller_1.me));
    router.post('/logout', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(auth_controller_1.logout));
    router.post('/forgot-password', (0, asyncHandler_1.asyncHandler)(auth_controller_1.forgotPassword));
    router.get('/reset-password/validate', (0, asyncHandler_1.asyncHandler)(auth_controller_1.validateResetToken));
    router.post('/reset-password', (0, asyncHandler_1.asyncHandler)(auth_controller_1.resetPasswordWithToken));
    return router;
}
//# sourceMappingURL=auth.routes.js.map