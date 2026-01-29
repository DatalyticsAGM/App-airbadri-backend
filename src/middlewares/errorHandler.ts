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
  const e = err as HttpError
  const status = e.status && Number.isFinite(e.status) ? e.status : 500
  const code = e.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR')
  const message = status === 500 ? 'Internal server error' : e.message || 'Error'

  const body: ApiErrorBody = { error: { code, message } }
  res.status(status).json(body)
}

