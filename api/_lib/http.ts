import type {VercelRequest, VercelResponse} from '@vercel/node'

/**
 * Возвращает JSON-ошибку в едином формате для serverless endpoint-ов.
 */
export function sendJsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({error})
}

/**
 * Проверяет HTTP-метод и проставляет Allow для отклонённых запросов.
 */
export function requireMethod(
  req: VercelRequest,
  res: VercelResponse,
  method: string
): {ok: true} | {ok: false; response: VercelResponse} {
  if (req.method === method) {
    return {ok: true}
  }

  res.setHeader('Allow', method)
  return {
    ok: false,
    response: sendJsonError(res, 405, 'Method not allowed'),
  }
}

/**
 * Проверяет, что запрос отправлен как JSON.
 */
export function requireJsonContentType(
  req: VercelRequest,
  res: VercelResponse
): {ok: true} | {ok: false; response: VercelResponse} {
  const contentType = req.headers['content-type']
  if (typeof contentType === 'string' && !contentType.includes('application/json')) {
    return {
      ok: false,
      response: sendJsonError(res, 415, 'Expected application/json'),
    }
  }

  return {ok: true}
}

/**
 * Безопасно парсит тело JSON-запроса из строки или объекта.
 */
export function parseJsonBody(req: VercelRequest): unknown {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}')
  }

  return req.body || {}
}

/**
 * Достаёт IP клиента из стандартных reverse-proxy заголовков.
 */
export function getClientIp(req: VercelRequest): string | null {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim()
  }

  const xri = req.headers['x-real-ip']
  if (typeof xri === 'string' && xri.length > 0) {
    return xri.trim()
  }

  return null
}
