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
 * reset de contraseña y perfil de usuario. Usa el repositorio de usuarios (memoria o MongoDB).
 * Dependencias: config/env, repositories, bcryptjs, jsonwebtoken, crypto.
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const repositories_1 = require("../repositories");
/**
 * Obtiene el id del usuario como string.
 *
 * @param user - Usuario en formato repositorio (UserForService).
 * @returns Id del usuario como string.
 */
function getUserId(user) {
    return user.id;
}
/**
 * Convierte un usuario almacenado a la forma pública segura para el cliente.
 *
 * @param user - Usuario en formato repositorio.
 * @returns Objeto PublicUser (id, fullName, email, avatarUrl opcional).
 */
function toPublicUser(user) {
    return { id: user.id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl };
}
/**
 * Genera un hash de la contraseña con bcrypt (salt de 10 rondas).
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
 * @param passwordHash - Hash guardado.
 * @returns Promesa con true si coinciden, false si no.
 */
async function verifyPassword(password, passwordHash) {
    return bcryptjs_1.default.compare(password, passwordHash);
}
/**
 * Genera un JWT para el usuario. El token incluye el userId en el claim "sub".
 *
 * @param userId - Id del usuario.
 * @returns Token JWT en string.
 */
function signAccessToken(userId) {
    const expiresIn = env_1.env.JWT_EXPIRES_IN;
    return jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_SECRET, { expiresIn });
}
/**
 * Hash SHA-256. Re-exportado desde utils/crypto.
 */
var crypto_2 = require("../utils/crypto");
Object.defineProperty(exports, "sha256", { enumerable: true, get: function () { return crypto_2.sha256; } });
/**
 * Genera un token aleatorio para el flujo de restablecimiento de contraseña.
 *
 * @returns Token en hexadecimal (64 caracteres).
 */
function generateResetToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
/**
 * Crea un nuevo usuario: hashea la contraseña y lo persiste vía repositorio.
 *
 * @param params - fullName, email y password en texto plano.
 * @returns Promesa con el usuario creado (UserForService).
 */
async function createUser(params) {
    const passwordHash = await hashPassword(params.password);
    return repositories_1.userRepository.create({
        fullName: params.fullName,
        email: params.email.toLowerCase(),
        passwordHash,
    });
}
/**
 * Busca un usuario por email (normalizado a minúsculas).
 *
 * @param email - Correo del usuario.
 * @returns Promesa con el usuario o null si no existe.
 */
async function findUserByEmail(email) {
    return repositories_1.userRepository.findByEmail(email);
}
/**
 * Busca un usuario por id.
 *
 * @param id - Id del usuario (string).
 * @returns Promesa con el usuario o null si no existe.
 */
async function findUserById(id) {
    return repositories_1.userRepository.findById(id);
}
/**
 * Guarda en el usuario el hash del token de reset y su fecha de expiración.
 *
 * @param userId - Id del usuario.
 * @param token - Token en texto plano (se guarda solo su hash SHA-256).
 * @param expiresAt - Fecha hasta la cual el token es válido.
 */
async function setResetPasswordToken(userId, token, expiresAt) {
    return repositories_1.userRepository.setResetPasswordToken(userId, token, expiresAt);
}
/**
 * Busca un usuario cuyo token de reset coincida (por hash) y no haya expirado.
 *
 * @param token - Token en texto plano enviado por el usuario.
 * @returns Promesa con el usuario o null si no hay ninguno válido.
 */
async function findUserByValidResetToken(token) {
    return repositories_1.userRepository.findByValidResetToken(token);
}
/**
 * Actualiza la contraseña del usuario y elimina el token de reset.
 *
 * @param userId - Id del usuario.
 * @param newPassword - Nueva contraseña en texto plano (se hashea antes de guardar).
 */
async function resetPassword(userId, newPassword) {
    const passwordHash = await hashPassword(newPassword);
    return repositories_1.userRepository.resetPassword(userId, passwordHash);
}
/**
 * Actualiza parcialmente el perfil del usuario (nombre, email, avatar).
 *
 * @param userId - Id del usuario.
 * @param patch - Objeto con fullName, email y/o avatarUrl opcionales.
 * @returns Promesa con el usuario actualizado o null.
 */
async function updateUserProfile(userId, patch) {
    return repositories_1.userRepository.update(userId, patch);
}
/**
 * Elimina un usuario por id.
 *
 * @param userId - Id del usuario a eliminar.
 * @returns Promesa con true si se eliminó, false si no existía.
 */
async function deleteUserById(userId) {
    return repositories_1.userRepository.delete(userId);
}
//# sourceMappingURL=auth.service.js.map