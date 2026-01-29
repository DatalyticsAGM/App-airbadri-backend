"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
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
        return next();
    }
    catch {
        return next((0, errorHandler_1.httpError)(401, 'UNAUTHORIZED', 'Invalid access token'));
    }
}
//# sourceMappingURL=auth.js.map