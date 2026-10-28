'use strict';

const pool = require('../config/database');

/**
 * GET /api/products
 * Retorna todos os produtos disponíveis no cardápio.
 */
async function listProducts(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price, image_url, available FROM products WHERE available = TRUE ORDER BY id'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/products/:id
 * Retorna um produto específico pelo seu ID.
 */
async function getProduct(req, res, next) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'Invalid product id.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, description, price, image_url, available FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listProducts, getProduct };
