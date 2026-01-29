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
    const status = e.status && Number.isFinite(e.status) ? e.status : 500;
    const code = e.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
    const message = status === 500 ? 'Internal server error' : e.message || 'Error';
    const body = { error: { code, message } };
    res.status(status).json(body);
}
//# sourceMappingURL=errorHandler.js.map