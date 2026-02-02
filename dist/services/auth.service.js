"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserId = getUserId;
exports.toPublicUser = toPublicUser;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signAccessToken = signAccessToken;
exports.sha256 = sha256;
exports.generateResetToken = generateResetToken;
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.setResetPasswordToken = setResetPasswordToken;
exports.findUserByValidResetToken = findUserByValidResetToken;
exports.resetPassword = resetPassword;
exports.updateUserProfile = updateUserProfile;
exports.deleteUserById = deleteUserById;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const memoryUsers_1 = require("../store/memoryUsers");
function isDbReady() {
    return mongoose_1.default.connection.readyState === 1;
}
function getUserId(user) {
    return '_id' in user ? user._id.toString() : user.id;
}
function toPublicUser(user) {
    const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : undefined;
    return { id: getUserId(user), fullName: user.fullName, email: user.email, avatarUrl };
}
async function hashPassword(password) {
    const saltRounds = 10;
    return bcryptjs_1.default.hash(password, saltRounds);
}
async function verifyPassword(password, passwordHash) {
    return bcryptjs_1.default.compare(password, passwordHash);
}
function signAccessToken(userId) {
    // jsonwebtoken v9 tipa expiresIn con un "StringValue" (p.ej. "7d").
    const expiresIn = env_1.env.JWT_EXPIRES_IN;
    return jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_SECRET, { expiresIn });
}
function sha256(input) {
    return crypto_1.default.createHash('sha256').update(input).digest('hex');
}
function generateResetToken() {
    // Token corto y simple para dev. En prod se envía por email.
    return crypto_1.default.randomBytes(32).toString('hex');
}
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
async function findUserByEmail(email) {
    if (!isDbReady())
        return (0, memoryUsers_1.memoryFindUserByEmail)(email);
    return User_1.User.findOne({ email: email.toLowerCase() });
}
async function findUserById(id) {
    if (!isDbReady())
        return (0, memoryUsers_1.memoryFindUserById)(id);
    return User_1.User.findById(id);
}
async function setResetPasswordToken(userId, token, expiresAt) {
    if (!isDbReady())
        return (0, memoryUsers_1.memorySetResetPasswordToken)(userId, token, expiresAt);
    await User_1.User.updateOne({ _id: userId }, { $set: { resetPasswordTokenHash: sha256(token), resetPasswordExpiresAt: expiresAt } });
}
async function findUserByValidResetToken(token) {
    if (!isDbReady())
        return (0, memoryUsers_1.memoryFindUserByValidResetToken)(token);
    const now = new Date();
    return User_1.User.findOne({
        resetPasswordTokenHash: sha256(token),
        resetPasswordExpiresAt: { $gt: now },
    });
}
async function resetPassword(userId, newPassword) {
    const passwordHash = await hashPassword(newPassword);
    if (!isDbReady())
        return (0, memoryUsers_1.memoryResetPassword)(userId, passwordHash);
    await User_1.User.updateOne({ _id: userId }, {
        $set: { passwordHash },
        $unset: { resetPasswordTokenHash: 1, resetPasswordExpiresAt: 1 },
    });
}
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
async function deleteUserById(userId) {
    if (!isDbReady())
        return (0, memoryUsers_1.memoryDeleteUser)(userId);
    const deleted = await User_1.User.findByIdAndDelete(userId);
    return Boolean(deleted);
}
//# sourceMappingURL=auth.service.js.map