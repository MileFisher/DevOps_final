require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const productRoutes = require('./routes/productRoutes');
const dataSource = require('./services/dataSource');
const uiRoutes = require('./routes/uiRoutes');
const path = require('path');
const fs = require('fs');

// ── Prometheus metrics setup ──────────────────────────────────
const promClient = require('prom-client');

// Collect default Node.js metrics (CPU, memory, event loop, GC)
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'app_' });

// Custom counter — total HTTP requests by method, route, status
const httpRequestCounter = new promClient.Counter({
  name: 'app_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Custom histogram — request duration in seconds
const httpRequestDuration = new promClient.Histogram({
  name: 'app_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

// Custom gauge — active connections right now
const activeConnections = new promClient.Gauge({
  name: 'app_active_connections',
  help: 'Number of active HTTP connections'
});

// Custom counter — MongoDB errors
const mongoErrorCounter = new promClient.Counter({
  name: 'app_mongo_errors_total',
  help: 'Total number of MongoDB connection errors'
});
// ─────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

// ── Metrics middleware — must be before routes ────────────────
app.use((req, res, next) => {
  // Skip metrics endpoint itself to avoid self-recording
  if (req.path === '/metrics') return next();

  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode
    };
    httpRequestCounter.inc(labels);
    end(labels);
    activeConnections.dec();
  });
  next();
});
// ─────────────────────────────────────────────────────────────

// view engine and static
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// ── Metrics endpoint for Prometheus to scrape ─────────────────
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});
// ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: process.env.APP_VERSION || 'local',
    dataSource: dataSource.isMongo ? 'mongodb' : 'in-memory',
    hostname: os.hostname()
  });
});

app.use('/', uiRoutes);
app.use('/products', productRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory at ${uploadsDir}`);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/products_db';
  let usingMongo = false;
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000
    });
    usingMongo = true;
    console.log('Connected to MongoDB — using mongodb as data source.');
  } catch (err) {
    usingMongo = false;
    mongoErrorCounter.inc();    // ← count MongoDB connection failures
    console.log('Failed to connect to MongoDB within 3s — falling back to in-memory database.');
  }

  await dataSource.init(usingMongo);

  app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT} — hostname: ${os.hostname()}`);
    console.log(`Data source in use: ${dataSource.isMongo ? 'mongodb' : 'in-memory'}`);
  });
}

start();

module.exports = app;