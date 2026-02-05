import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '../config/env'
import { httpError } from './errorHandler'

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''

  if (!token) return next(httpError(401, 'UNAUTHORIZED', 'Missing access token'))

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string; role?: string }
    if (!payload.sub) return next(httpError(401, 'UNAUTHORIZED', 'Invalid access token'))

    ;(req as any).userId = payload.sub
    ;(req as any).userRole = payload.role === 'admin' || payload.role === 'host' ? payload.role : 'user'
    return next()
  } catch {
    return next(httpError(401, 'UNAUTHORIZED', 'Invalid access token'))
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const role = String((req as any).userRole || 'user')
  if (role !== 'admin') return next(httpError(403, 'FORBIDDEN', 'Admin access required'))
  return next()
}

export function requireHostOrAdmin(req: Request, _res: Response, next: NextFunction) {
  const role = String((req as any).userRole || 'user')
  if (role !== 'host' && role !== 'admin') return next(httpError(403, 'FORBIDDEN', 'Host or admin access required'))
  return next()
}

