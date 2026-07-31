import config from '../config/index.js'

const attempts = new Map()

const keyOf = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  const email = String(req.body?.email || '')
    .toLowerCase()
    .trim()
  return `${ip}|${email}`
}

const sweep = () => {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    if (entry.blockedUntil <= now) {
      attempts.delete(key)
    }
  }
}

export const loginThrottle = (req, res, next) => {
  const key = keyOf(req)
  const entry = attempts.get(key)

  if (entry && entry.blockedUntil > Date.now()) {
    return res.status(429).json({
      success: false,
      message: 'Too many failed login attempts. Please try again later.',
    })
  }

  res.on('finish', () => {
    if (res.statusCode === 200) {
      attempts.delete(key)
      return
    }
    if (res.statusCode === 401) {
      const now = Date.now()
      const current = attempts.get(key)
      const next =
        current && current.resetAt > now
          ? current
          : {
              count: 0,
              resetAt: now + config.loginThrottle.windowMs,
              blockedUntil: 0,
            }
      next.count += 1
      if (next.count >= config.loginThrottle.maxFailures) {
        next.blockedUntil = now + config.loginThrottle.windowMs
      }
      attempts.set(key, next)
    }
  })

  next()
}

const sweepTimer = setInterval(sweep, config.loginThrottle.windowMs)
sweepTimer.unref()
