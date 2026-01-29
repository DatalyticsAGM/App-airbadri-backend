"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
function isValidEmail(email) {
    // Simple y suficiente para este milestone.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
//# sourceMappingURL=validation.js.map