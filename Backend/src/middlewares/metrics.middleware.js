const metrics = {
  requests: 0,
  errors: 0,
  totalTimeMs: 0,
  byRoute: new Map(),
};

const trackRoute = (req, duration, statusCode) => {
  const route = `${req.method} ${req.route?.path || req.originalUrl.split('?')[0]}`;
  const entry = metrics.byRoute.get(route) || {
    count: 0,
    errors: 0,
    totalTimeMs: 0,
    avgMs: 0,
    maxMs: 0,
  };
  entry.count += 1;
  entry.totalTimeMs += duration;
  entry.avgMs = Math.round(entry.totalTimeMs / entry.count);
  entry.maxMs = Math.max(entry.maxMs, duration);
  if (statusCode >= 400) entry.errors += 1;
  metrics.byRoute.set(route, entry);
};

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.requests += 1;
    metrics.totalTimeMs += duration;
    if (res.statusCode >= 500) metrics.errors += 1;
    trackRoute(req, duration, res.statusCode);
  });
  next();
};

export const getMetrics = () => ({
  requests: metrics.requests,
  errors: metrics.errors,
  errorRate: metrics.requests > 0 ? metrics.errors / metrics.requests : 0,
  avgResponseMs: metrics.requests > 0 ? Math.round(metrics.totalTimeMs / metrics.requests) : 0,
  routes: Object.fromEntries(metrics.byRoute),
});
