"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256 = void 0;
exports.getUserId = getUserId;
exports.toPublicUser = toPublicUser;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signAccessToken = signAccessToken;
exports.generateResetToken = generateResetToken;
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.setResetPasswordToken = setResetPasswordToken;
exports.findUserByValidResetToken = findUserByValidResetToken;
exports.resetPassword = resetPassword;
exports.updateUserProfile = updateUserProfile;
exports.deleteUserById = deleteUserById;
/**
 * Módulo auth.service (servicio de autenticación).
 *
 * Contiene la lógica de negocio de autenticación: registro, login, tokens JWT,
 * reset de contraseña y perfil de usuario. Usa el modelo User cuando MongoDB está
 * disponible; si no, delega en el store en memoria (memoryUsers).
 * Dependencias: config/env, models/User, store/memoryUsers, bcryptjs, jsonwebtoken, crypto.
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const crypto_2 = require("../utils/crypto");
const memoryUsers_1 = require("../store/memoryUsers");
function isDbReady() {
    if (env_1.env.USE_MEMORY_ONLY)
        return false;
    return mongoose_1.default.connection.readyState === 1;
}
/**
 * Obtiene el id del usuario como string, tanto si viene de MongoDB (_id) como del store en memoria (id).
 *
 * @param user - Usuario en formato documento o memoria.
 * @returns Id del usuario como string.
 */
function getUserId(user) {
    return '_id' in user ? user._id.toString() : user.id;
}
/**
 * Convierte un usuario almacenado (DB o memoria) a la forma pública segura para el cliente.
 *
 * @param user - Usuario en formato documento o memoria.
 * @returns Objeto PublicUser (id, fullName, email, avatarUrl opcional).
 */
function toPublicUser(user) {
    const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : undefined;
    return { id: getUserId(user), fullName: user.fullName, email: user.email, avatarUrl };
}
/**
 * Genera un hash de la contraseña con bcrypt (salt de 10 rondas).
 * Hash: resultado irreversible de una función criptográfica; permite comparar contraseñas sin guardarlas en claro.
 *
 * @param password - Contraseña en texto plano.
 * @returns Promesa con el hash en string.
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return bcryptjs_1.default.hash(password, saltRounds);
}
/**
 * Comprueba si la contraseña en texto plano coincide con el hash guardado.
 *
 * @param password - Contraseña en texto plano.
 * @param passwordHash - Hash guardado (p. ej. de User.passwordHash).
 * @returns Promesa con true si coinciden, false si no.
 */
async function verifyPassword(password, passwordHash) {
    return bcryptjs_1.default.compare(password, passwordHash);
}
/**
 * Genera un JWT (JSON Web Token) para el usuario. El token incluye el userId en el claim "sub"
 * y caduca según env.JWT_EXPIRES_IN (p. ej. "7d").
 *
 * @param userId - Id del usuario.
 * @returns Token JWT en string.
 */
function signAccessToken(userId) {
    // jsonwebtoken v9 tipa expiresIn con un "StringValue" (p.ej. "7d").
    const expiresIn = env_1.env.JWT_EXPIRES_IN;
    return jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_SECRET, { expiresIn });
}
/**
 * Calcula el hash SHA-256 de una cadena (p. ej. para guardar el token de reset sin guardar el token en claro).
 * Re-exportado desde utils/crypto para uso en auth y stores.
 *
 * @param input - Texto a hashear.
 * @returns Hash en hexadecimal.
 */
var crypto_3 = require("../utils/crypto");
Object.defineProperty(exports, "sha256", { enumerable: true, get: function () { return crypto_3.sha256; } });
/**
 * Genera un token aleatorio para el flujo de restablecimiento de contraseña.
 * En producción este token se enviaría por email; aquí es solo un string aleatorio.
 *
 * @returns Token en hexadecimal (64 caracteres).
 */
function generateResetToken() {
    // Token corto y simple para dev. En prod se envía por email.
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Crea un nuevo usuario: hashea la contraseña y lo persiste en memoria o en MongoDB según disponibilidad.
 *
 * @param params - fullName, email y password en texto plano.
 * @returns Promesa con el documento de usuario creado (UserDoc o equivalente en memoria).
 */
async function createUser(params) {
    const passwordHash = await hashPassword(params.password);
    if (!isDbReady()) {
        return (0, memoryUsers_1.memoryCreateUser)({
            fullName: params.fullName,
            email: params.email.toLowerCase(),
            passwordHash,
        });
    }
    return User_1.User.create({
        fullName: params.fullName,
        email: params.email.toLowerCase(),
        passwordHash,
    });
}
/**
 * Busca un usuario por email (normalizado a minúsculas). Usa memoria o MongoDB según isDbReady().
 *
 * @param email - Correo del usuario.
 * @returns Promesa con el usuario o null si no existe.
 */
async function findUserByEmail(email) {
    if (!isDbReady())
        return (0, memoryUsers_1.memoryFindUserByEmail)(email);
    return User_1.User.findOne({ email: email.toLowerCase() });
}
/**
 * Busca un usuario por id. Usa memoria o MongoDB según isDbReady().
 *
 * @param id - Id del usuario (string).
 * @returns Promesa con el usuario o null si no existe.
 */
async function findUserById(id) {
    if (!isDbReady())
        return (0, memoryUsers_1.memoryFindUserById)(id);
    return User_1.User.findById(id);
}
/**
 * Guarda en el usuario el hash del token de reset y su fecha de expiración.
 *
 * @param userId - Id del usuario.
 * @param token - Token en texto plano (se guarda solo su hash SHA-256).
 * @param expiresAt - Fecha hasta la cual el token es válido.
 */
async function setResetPasswordToken(userId, token, expiresAt) {
    if (!isDbReady())
        return (0, memoryUsers_1.memorySetResetPasswordToken)(userId, token, expiresAt);
    await User_1.User.updateOne({ _id: userId }, { $set: { resetPasswordTokenHash: (0, crypto_2.sha256)(token), resetPasswordExpiresAt: expiresAt } });
}
/**
 * Busca un usuario cuyo token de reset coincida (por hash) y no haya expirado.
 *
 * @param token - Token en texto plano enviado por el usuario.
 * @returns Promesa con el usuario o null si no hay ninguno válido.
 */
async function findUserByValidResetToken(token) {
    if (!isDbReady())
        return (0, memoryUsers_1.memoryFindUserByValidResetToken)(token);
    const now = new Date();
    return User_1.User.findOne({
        resetPasswordTokenHash: (0, crypto_2.sha256)(token),
        resetPasswordExpiresAt: { $gt: now },
    });
}
/**
 * Actualiza la contraseña del usuario y elimina el token de reset.
 *
 * @param userId - Id del usuario.
 * @param newPassword - Nueva contraseña en texto plano (se hashea antes de guardar).
 */
async function resetPassword(userId, newPassword) {
    const passwordHash = await hashPassword(newPassword);
    if (!isDbReady())
        return (0, memoryUsers_1.memoryResetPassword)(userId, passwordHash);
    await User_1.User.updateOne({ _id: userId }, {
        $set: { passwordHash },
        $unset: { resetPasswordTokenHash: 1, resetPasswordExpiresAt: 1 },
    });
}
/**
 * Actualiza parcialmente el perfil del usuario (nombre, email, avatar). Solo aplica campos presentes en patch.
 *
 * @param userId - Id del usuario.
 * @param patch - Objeto con fullName, email y/o avatarUrl opcionales.
 * @returns Promesa con el documento actualizado (new: true) o el equivalente en memoria.
 */
async function updateUserProfile(userId, patch) {
    if (!isDbReady()) {
        return (0, memoryUsers_1.memoryUpdateUser)(userId, patch);
    }
    const $set = {};
    if (typeof patch.fullName === 'string')
        $set.fullName = patch.fullName;
    if (typeof patch.email === 'string')
        $set.email = patch.email.toLowerCase();
    if (typeof patch.avatarUrl === 'string')
        $set.avatarUrl = patch.avatarUrl;
    return User_1.User.findByIdAndUpdate(userId, { $set }, { new: true });
}
/**
 * Elimina un usuario por id. Usa memoria o MongoDB según isDbReady().
 *
 * @param userId - Id del usuario a eliminar.
 * @returns Promesa con true si se eliminó, false si no existía.
 */
async function deleteUserById(userId) {
    if (!isDbReady())
        return (0, memoryUsers_1.memoryDeleteUser)(userId);
    const deleted = await User_1.User.findByIdAndDelete(userId);
    return Boolean(deleted);
}
//# sourceMappingURL=auth.service.js.map