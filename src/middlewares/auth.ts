import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '../config/env'
import { httpError } from './errorHandler'

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''

  if (!token) return next(httpError(401, 'UNAUTHORIZED', 'Missing access token'))

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string }
    if (!payload.sub) return next(httpError(401, 'UNAUTHORIZED', 'Invalid access token'))

    ;(req as any).userId = payload.sub
    return next()
  } catch {
    return next(httpError(401, 'UNAUTHORIZED', 'Invalid access token'))
  }
}

