"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryCreateUser = memoryCreateUser;
exports.memoryFindUserByEmail = memoryFindUserByEmail;
exports.memoryFindUserById = memoryFindUserById;
exports.memoryUpdateUser = memoryUpdateUser;
exports.memoryDeleteUser = memoryDeleteUser;
exports.memorySetResetPasswordToken = memorySetResetPasswordToken;
exports.memoryFindUserByValidResetToken = memoryFindUserByValidResetToken;
exports.memoryResetPassword = memoryResetPassword;
exports.memoryResetForDev = memoryResetForDev;
const crypto_1 = __importDefault(require("crypto"));
const crypto_2 = require("../utils/crypto");
const usersById = new Map();
const usersByEmail = new Map(); // email -> id
function memoryCreateUser(params) {
    const requestedRole = params.role === 'admin' || params.role === 'host' ? params.role : 'user';
    // Regla de negocio: solo puede existir 1 admin. Si ya existe, se reutiliza.
    if (requestedRole === 'admin') {
        for (const u of usersById.values()) {
            if (u.role === 'admin')
                return u;
        }
    }
    const id = crypto_1.default.randomUUID();
    const role = requestedRole;
    const user = {
        id,
        fullName: params.fullName,
        email: params.email.toLowerCase(),
        role,
        passwordHash: params.passwordHash,
    };
    usersById.set(id, user);
    usersByEmail.set(user.email, id);
    return user;
}
function memoryFindUserByEmail(email) {
    const id = usersByEmail.get(email.toLowerCase());
    if (!id)
        return null;
    return usersById.get(id) || null;
}
function memoryFindUserById(id) {
    return usersById.get(id) || null;
}
function memoryUpdateUser(userId, patch) {
    const user = usersById.get(userId);
    if (!user)
        return null;
    if (typeof patch.fullName === 'string') {
        user.fullName = patch.fullName;
    }
    if (typeof patch.email === 'string') {
        const nextEmail = patch.email.toLowerCase();
        if (nextEmail !== user.email) {
            usersByEmail.delete(user.email);
            usersByEmail.set(nextEmail, userId);
            user.email = nextEmail;
        }
    }
    if (typeof patch.avatarUrl === 'string') {
        user.avatarUrl = patch.avatarUrl;
    }
    if (patch.role === 'admin' || patch.role === 'host' || patch.role === 'user') {
        user.role = patch.role;
    }
    return user;
}
function memoryDeleteUser(userId) {
    const user = usersById.get(userId);
    if (!user)
        return false;
    usersById.delete(userId);
    usersByEmail.delete(user.email);
    return true;
}
function memorySetResetPasswordToken(userId, token, expiresAt) {
    const user = usersById.get(userId);
    if (!user)
        return;
    user.resetPasswordTokenHash = (0, crypto_2.sha256)(token);
    user.resetPasswordExpiresAt = expiresAt;
}
function memoryFindUserByValidResetToken(token) {
    const tokenHash = (0, crypto_2.sha256)(token);
    const now = Date.now();
    for (const user of usersById.values()) {
        if (!user.resetPasswordTokenHash || !user.resetPasswordExpiresAt)
            continue;
        if (user.resetPasswordTokenHash !== tokenHash)
            continue;
        if (user.resetPasswordExpiresAt.getTime() <= now)
            continue;
        return user;
    }
    return null;
}
function memoryResetPassword(userId, newPasswordHash) {
    const user = usersById.get(userId);
    if (!user)
        return;
    user.passwordHash = newPasswordHash;
    delete user.resetPasswordTokenHash;
    delete user.resetPasswordExpiresAt;
}
/** Solo para uso en seed de desarrollo. Vacía todos los usuarios. */
function memoryResetForDev() {
    usersById.clear();
    usersByEmail.clear();
}
//# sourceMappingURL=memoryUsers.js.map