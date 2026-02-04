import type { NextFunction, Request, Response } from 'express'

export type ApiErrorBody = { error: { code: string; message: string } }

export type HttpError = Error & { status?: number; code?: string }

export function httpError(status: number, code: string, message: string): HttpError {
  const err = new Error(message) as HttpError
  err.status = status
  err.code = code
  return err
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const e = err as HttpError & { name?: string; code?: number; message?: string; kind?: string }

  // Normalización de errores típicos de Mongo/Mongoose para evitar 500 por inputs inválidos.
  // - CastError (ObjectId inválido) -> 400
  // - ValidationError -> 400
  // - Duplicate key (E11000) -> 409
  const isCastError = e?.name === 'CastError' && (e as any)?.kind === 'ObjectId'
  const isValidationError = e?.name === 'ValidationError'
  const isDuplicateKey = (e as any)?.code === 11000

  const inferredStatus = isDuplicateKey ? 409 : isCastError || isValidationError ? 400 : undefined
  const inferredCode = isDuplicateKey
    ? 'DUPLICATE_KEY'
    : isCastError || isValidationError
      ? 'VALIDATION_ERROR'
      : undefined

  const status = (e.status && Number.isFinite(e.status) ? e.status : inferredStatus) ?? 500
  const code = e.code || inferredCode || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR')
  const message = status === 500 ? 'Internal server error' : e.message || 'Error'

  const body: ApiErrorBody = { error: { code, message } }
  res.status(status).json(body)
}

