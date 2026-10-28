'use strict';

const { Router } = require('express');
const {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
} = require('../controllers/ordersController');

const router = Router();

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
