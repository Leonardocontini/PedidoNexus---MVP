'use strict';

const { Router } = require('express');
const { listProducts, getProduct } = require('../controllers/productsController');

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);

module.exports = router;
