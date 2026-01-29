"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.me = me;
exports.logout = logout;
exports.forgotPassword = forgotPassword;
exports.validateResetToken = validateResetToken;
exports.resetPasswordWithToken = resetPasswordWithToken;
const errorHandler_1 = require("../middlewares/errorHandler");
const validation_1 = require("../utils/validation");
const auth_service_1 = require("../services/auth.service");
async function signup(req, res) {
    const fullName = String(req.body?.fullName || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!fullName)
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'fullName is required');
    if (!email || !(0, validation_1.isValidEmail)(email))
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'email is invalid');
    if (!password || password.length < 6)
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'password must be at least 6 characters');
    const existing = await (0, auth_service_1.findUserByEmail)(email);
    if (existing)
        throw (0, errorHandler_1.httpError)(409, 'EMAIL_IN_USE', 'Email already registered');
    const user = await (0, auth_service_1.createUser)({ fullName, email, password });
    const accessToken = (0, auth_service_1.signAccessToken)(user._id.toString());
    res.status(201).json({ user: (0, auth_service_1.toPublicUser)(user), accessToken });
}
async function login(req, res) {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !(0, validation_1.isValidEmail)(email))
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'email is invalid');
    if (!password)
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'password is required');
    const user = await (0, auth_service_1.findUserByEmail)(email);
    if (!user)
        throw (0, errorHandler_1.httpError)(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    const ok = await (0, auth_service_1.verifyPassword)(password, user.passwordHash);
    if (!ok)
        throw (0, errorHandler_1.httpError)(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    const accessToken = (0, auth_service_1.signAccessToken)(user._id.toString());
    res.json({ user: (0, auth_service_1.toPublicUser)(user), accessToken });
}
async function me(req, res) {
    const userId = String(req.userId || '');
    if (!userId)
        throw (0, errorHandler_1.httpError)(401, 'UNAUTHORIZED', 'Unauthorized');
    const user = await (0, auth_service_1.findUserById)(userId);
    if (!user)
        throw (0, errorHandler_1.httpError)(401, 'UNAUTHORIZED', 'Unauthorized');
    res.json({ user: (0, auth_service_1.toPublicUser)(user) });
}
async function logout(_req, res) {
    // JWT stateless: el frontend borra el token.
    res.json({ ok: true });
}
async function forgotPassword(req, res) {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !(0, validation_1.isValidEmail)(email))
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'email is invalid');
    const user = await (0, auth_service_1.findUserByEmail)(email);
    // Por seguridad, respondemos igual exista o no el usuario.
    if (!user)
        return res.json({ ok: true });
    const resetToken = (0, auth_service_1.generateResetToken)();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    await (0, auth_service_1.setResetPasswordToken)(user._id.toString(), resetToken, expiresAt);
    // Modo dev: se devuelve el token para que el frontend lo use.
    res.json({ resetToken, expiresAt: expiresAt.toISOString() });
}
async function validateResetToken(req, res) {
    const token = String(req.query?.token || '').trim();
    if (!token)
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'token is required');
    const user = await (0, auth_service_1.findUserByValidResetToken)(token);
    if (!user)
        throw (0, errorHandler_1.httpError)(400, 'INVALID_TOKEN', 'Token is invalid or expired');
    res.json({ ok: true, expiresAt: user.resetPasswordExpiresAt?.toISOString() });
}
async function resetPasswordWithToken(req, res) {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    if (!token)
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'token is required');
    if (!password || password.length < 6)
        throw (0, errorHandler_1.httpError)(400, 'VALIDATION_ERROR', 'password must be at least 6 characters');
    const user = await (0, auth_service_1.findUserByValidResetToken)(token);
    if (!user)
        throw (0, errorHandler_1.httpError)(400, 'INVALID_TOKEN', 'Token is invalid or expired');
    await (0, auth_service_1.resetPassword)(user._id.toString(), password);
    res.json({ ok: true });
}
//# sourceMappingURL=auth.controller.js.map