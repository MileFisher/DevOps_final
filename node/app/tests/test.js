function buildRes() {
	return {
		json: jest.fn(),
		render: jest.fn(),
		status: jest.fn().mockReturnThis()
	};
}

function buildMetricsRes(statusCode = 200) {
	const EventEmitter = require('events');
	const res = new EventEmitter();
	res.statusCode = statusCode;
	return res;
}

describe('product controller and ui routes', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	test('productController list returns 10 items in data', async () => {
		const tenItems = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), name: `item-${i + 1}` }));

		jest.doMock('../services/dataSource', () => ({
			getAll: jest.fn().mockResolvedValue(tenItems),
			isMongo: false
		}));

		const controller = require('../controllers/productController');
		const req = {};
		const res = buildRes();
		const next = jest.fn();

		await controller.list(req, res, next);

		expect(next).not.toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledTimes(1);
		const payload = res.json.mock.calls[0][0];
		expect(payload.data).toHaveLength(10);
	});

	test('productController source is mongodb when datasource uses mongo', async () => {
		jest.doMock('../services/dataSource', () => ({
			getAll: jest.fn().mockResolvedValue([]),
			isMongo: true
		}));

		const controller = require('../controllers/productController');
		const req = {};
		const res = buildRes();
		const next = jest.fn();

		await controller.list(req, res, next);

		expect(next).not.toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledTimes(1);
		const payload = res.json.mock.calls[0][0];
		expect(payload.source).toBe('mongodb');
	});

	test('uiRoutes root route renders index view', async () => {
		const sampleProducts = [{ id: '1', name: 'sample' }];

		jest.doMock('../services/dataSource', () => ({
			getAll: jest.fn().mockResolvedValue(sampleProducts),
			isMongo: false
		}));

		const router = require('../routes/uiRoutes');
		const rootLayer = router.stack.find((layer) => layer.route && layer.route.path === '/' && layer.route.methods.get);
		const handler = rootLayer.route.stack[0].handle;

		const req = {};
		const res = buildRes();
		const next = jest.fn();

		await handler(req, res, next);

		expect(next).not.toHaveBeenCalled();
		expect(res.render).toHaveBeenCalledTimes(1);
		expect(res.render).toHaveBeenCalledWith(
			'index',
			expect.objectContaining({
				products: sampleProducts,
				source: 'in-memory'
			})
		);
	});
});

describe('custom application metrics', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	test('metrics middleware records request and latency counters', () => {
		const metrics = require('../services/metrics.service');
		metrics.resetMetrics();

		const req = {
			method: 'GET',
			baseUrl: '/products',
			route: { path: '/:id' },
			originalUrl: '/products/123'
		};
		const res = buildMetricsRes(200);
		const next = jest.fn();

		metrics.metricsMiddleware(req, res, next);
		res.emit('finish');

		const output = metrics.renderPrometheusMetrics();

		expect(next).toHaveBeenCalledTimes(1);
		expect(output).toContain('app_http_requests_total{method="GET",route="/products/:id",status_code="200",status_class="2xx"} 1');
		expect(output).toContain('app_http_request_duration_seconds_count{method="GET",route="/products/:id",status_code="200",status_class="2xx"} 1');
	});

	test('metrics middleware records error counts for 4xx and 5xx responses', () => {
		const metrics = require('../services/metrics.service');
		metrics.resetMetrics();

		const req = {
			method: 'POST',
			baseUrl: '/products',
			route: { path: '/' },
			originalUrl: '/products'
		};
		const res = buildMetricsRes(500);

		metrics.metricsMiddleware(req, res, jest.fn());
		res.emit('finish');

		const output = metrics.renderPrometheusMetrics();

		expect(output).toContain('app_http_errors_total{method="POST",route="/products",status_code="500",status_class="5xx"} 1');
	});
});
