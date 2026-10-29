'use strict';

const { Router } = require('express');
const { upload }  = require('../config/upload');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productsController');

const router = Router();

router.get('/',       listProducts);
router.get('/:id',    getProduct);
router.post('/',      upload.single('image'), createProduct);
router.put('/:id',    upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
