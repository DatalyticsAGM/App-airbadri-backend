"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpError = httpError;
exports.errorHandler = errorHandler;
function httpError(status, code, message) {
    const err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
}
function errorHandler(err, _req, res, _next) {
    const e = err;
    // Normalización de errores típicos de Mongo/Mongoose para evitar 500 por inputs inválidos.
    // - CastError (ObjectId inválido) -> 400
    // - ValidationError -> 400
    // - Duplicate key (E11000) -> 409
    const isCastError = e?.name === 'CastError' && e?.kind === 'ObjectId';
    const isValidationError = e?.name === 'ValidationError';
    const isDuplicateKey = e?.code === 11000;
    const inferredStatus = isDuplicateKey ? 409 : isCastError || isValidationError ? 400 : undefined;
    const inferredCode = isDuplicateKey
        ? 'DUPLICATE_KEY'
        : isCastError || isValidationError
            ? 'VALIDATION_ERROR'
            : undefined;
    const status = (e.status && Number.isFinite(e.status) ? e.status : inferredStatus) ?? 500;
    const code = e.code || inferredCode || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
    const message = status === 500 ? 'Internal server error' : e.message || 'Error';
    const body = { error: { code, message } };
    res.status(status).json(body);
}
//# sourceMappingURL=errorHandler.js.map