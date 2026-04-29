const express = require('express');
const router = express.Router();
const dataSource = require('../services/dataSource');
const os = require('os');

router.get('/', async (req, res, next) => {
  try {
    const products = await dataSource.getAll();
    const appVersion = process.env.APP_VERSION || 'local';
    const appVersionShort = appVersion.startsWith('sha-') ? appVersion.slice(0, 16) : appVersion;

    res.render('index', {
      products,
      hostname: os.hostname(),
      source: dataSource.isMongo ? 'mongodb' : 'in-memory',
      appVersion,
      appVersionShort
    });
  } catch (err) { next(err); }
});

module.exports = router;
