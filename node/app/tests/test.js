function buildRes() {
	return {
		json: jest.fn(),
		render: jest.fn(),
		status: jest.fn().mockReturnThis()
	};
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
