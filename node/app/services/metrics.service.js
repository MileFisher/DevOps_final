const os = require('os');

const APP_NAME = process.env.APP_NAME || 'devops_final';
const APP_VERSION = process.env.APP_VERSION || 'local';
const HOSTNAME = os.hostname();
const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

let requestCount = new Map();
let errorCount = new Map();
let durationHistogram = new Map();
let inFlightRequests = 0;

function labelValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function metricKey(labels) {
  return JSON.stringify(labels);
}

function labelsToPrometheus(labels) {
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${labelValue(value)}"`)
    .join(',');
}

function normalizePath(path) {
  const rawPath = (path || '/').split('?')[0] || '/';
  return rawPath
    .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id')
    .replace(/\/[0-9a-fA-F-]{32,36}(?=\/|$)/g, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}

function routeLabel(req) {
  if (req.route && req.route.path) {
    const mountPath = req.baseUrl || '';
    const routePath = req.route.path === '/' ? '' : req.route.path;
    return `${mountPath}${routePath}` || '/';
  }

  return normalizePath(req.originalUrl || req.url || '/');
}

function incrementCounter(counter, labels, amount = 1) {
  const key = metricKey(labels);
  const current = counter.get(key) || { labels, value: 0 };
  current.value += amount;
  counter.set(key, current);
}

function getHistogram(labels) {
  const key = metricKey(labels);
  const current = durationHistogram.get(key);
  if (current) return current;

  const created = {
    labels,
    buckets: DURATION_BUCKETS.map((le) => ({ le, count: 0 })),
    count: 0,
    sum: 0
  };
  durationHistogram.set(key, created);
  return created;
}

function observeDuration(labels, seconds) {
  const histogram = getHistogram(labels);
  histogram.count += 1;
  histogram.sum += seconds;

  histogram.buckets.forEach((bucket) => {
    if (seconds <= bucket.le) {
      bucket.count += 1;
    }
  });
}

function metricsMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  inFlightRequests += 1;

  res.on('finish', () => {
    inFlightRequests = Math.max(0, inFlightRequests - 1);

    const statusCode = res.statusCode || 0;
    const statusClass = statusCode > 0 ? `${Math.floor(statusCode / 100)}xx` : 'unknown';
    const labels = {
      method: req.method,
      route: routeLabel(req),
      status_code: statusCode,
      status_class: statusClass
    };

    incrementCounter(requestCount, labels);

    if (statusCode >= 400) {
      incrementCounter(errorCount, labels);
    }

    const elapsedSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
    observeDuration(labels, elapsedSeconds);
  });

  next();
}

function renderCounter(name, help, counter) {
  const lines = [`# HELP ${name} ${help}`, `# TYPE ${name} counter`];
  [...counter.values()]
    .sort((a, b) => labelsToPrometheus(a.labels).localeCompare(labelsToPrometheus(b.labels)))
    .forEach(({ labels, value }) => {
      lines.push(`${name}{${labelsToPrometheus(labels)}} ${value}`);
    });
  return lines;
}

function renderDurationHistogram() {
  const name = 'app_http_request_duration_seconds';
  const lines = [
    `# HELP ${name} HTTP request latency in seconds.`,
    `# TYPE ${name} histogram`
  ];

  [...durationHistogram.values()]
    .sort((a, b) => labelsToPrometheus(a.labels).localeCompare(labelsToPrometheus(b.labels)))
    .forEach((histogram) => {
      histogram.buckets.forEach((bucket) => {
        lines.push(`${name}_bucket{${labelsToPrometheus({ ...histogram.labels, le: bucket.le })}} ${bucket.count}`);
      });
      lines.push(`${name}_bucket{${labelsToPrometheus({ ...histogram.labels, le: '+Inf' })}} ${histogram.count}`);
      lines.push(`${name}_sum{${labelsToPrometheus(histogram.labels)}} ${histogram.sum}`);
      lines.push(`${name}_count{${labelsToPrometheus(histogram.labels)}} ${histogram.count}`);
    });

  return lines;
}

function renderPrometheusMetrics() {
  return [
    '# HELP app_info Static application build and instance information.',
    '# TYPE app_info gauge',
    `app_info{app="${labelValue(APP_NAME)}",version="${labelValue(APP_VERSION)}",hostname="${labelValue(HOSTNAME)}"} 1`,
    '# HELP app_http_requests_in_flight Current number of HTTP requests being processed.',
    '# TYPE app_http_requests_in_flight gauge',
    `app_http_requests_in_flight ${inFlightRequests}`,
    ...renderCounter('app_http_requests_total', 'Total HTTP requests processed by the application.', requestCount),
    ...renderCounter('app_http_errors_total', 'Total HTTP responses with status code 4xx or 5xx.', errorCount),
    ...renderDurationHistogram()
  ].join('\n') + '\n';
}

function resetMetrics() {
  requestCount = new Map();
  errorCount = new Map();
  durationHistogram = new Map();
  inFlightRequests = 0;
}

module.exports = {
  metricsMiddleware,
  renderPrometheusMetrics,
  resetMetrics
};
