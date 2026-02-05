"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.requireHostOrAdmin = requireHostOrAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
function requireAuth(req, _res, next) {
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    if (!token)
        return next((0, errorHandler_1.httpError)(401, 'UNAUTHORIZED', 'Missing access token'));
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        if (!payload.sub)
            return next((0, errorHandler_1.httpError)(401, 'UNAUTHORIZED', 'Invalid access token'));
        req.userId = payload.sub;
        req.userRole = payload.role === 'admin' || payload.role === 'host' ? payload.role : 'user';
        return next();
    }
    catch {
        return next((0, errorHandler_1.httpError)(401, 'UNAUTHORIZED', 'Invalid access token'));
    }
}
function requireAdmin(req, _res, next) {
    const role = String(req.userRole || 'user');
    if (role !== 'admin')
        return next((0, errorHandler_1.httpError)(403, 'FORBIDDEN', 'Admin access required'));
    return next();
}
function requireHostOrAdmin(req, _res, next) {
    const role = String(req.userRole || 'user');
    if (role !== 'host' && role !== 'admin')
        return next((0, errorHandler_1.httpError)(403, 'FORBIDDEN', 'Host or admin access required'));
    return next();
}
//# sourceMappingURL=auth.js.map