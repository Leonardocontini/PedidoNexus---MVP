'use strict';

const fs   = require('fs');
const path = require('path');
const pool = require('../config/database');

function buildImageUrl(filename) {
  const base = process.env.API_BASE_URL || `http://localhost:${process.env.API_PORT || 3000}`;
  return `${base}/uploads/${filename}`;
}

/**
 * GET /api/products
 * ?available=true  → só produtos disponíveis (usado pelo totem)
 * sem parâmetro    → todos os produtos (usado pelo painel do restaurante)
 */
async function listProducts(req, res, next) {
  try {
    const onlyAvailable = req.query.available === 'true';
    const query = onlyAvailable
      ? 'SELECT id, name, description, price, image_url, available FROM products WHERE available = TRUE ORDER BY id'
      : 'SELECT id, name, description, price, image_url, available FROM products ORDER BY id';

    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/products/:id
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

/**
 * POST /api/products
 * Cria um produto. Aceita multipart/form-data (campo `image` opcional).
 */
async function createProduct(req, res, next) {
  const { name, description, price, available } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'O campo name é obrigatório.' });
  }
  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: 'O campo price deve ser um número maior ou igual a zero.' });
  }

  const imageUrlValue = req.file ? buildImageUrl(req.file.filename) : null;
  const isAvailable   = available === undefined ? true : String(available) === 'true';

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, image_url, available)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), description?.trim() || null, Number(price), imageUrlValue, isAvailable]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/products/:id
 * Atualiza um produto. Aceita multipart/form-data (campo `image` opcional).
 * Se uma nova imagem for enviada, o arquivo anterior é deletado do disco.
 */
async function updateProduct(req, res, next) {
  const { id } = req.params;
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'Invalid product id.' });
  }

  let current;
  try {
    const found = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    current = found.rows[0];
  } catch (err) {
    return next(err);
  }

  const { name, description, price, available } = req.body;

  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ error: 'O campo name não pode ser vazio.' });
  }
  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    return res.status(400).json({ error: 'O campo price deve ser um número maior ou igual a zero.' });
  }

  const updatedName        = name        !== undefined ? String(name).trim()              : current.name;
  const updatedDescription = description !== undefined ? String(description).trim() || null : current.description;
  const updatedPrice       = price       !== undefined ? Number(price)                     : current.price;
  const updatedAvailable   = available   !== undefined ? String(available) === 'true'      : current.available;

  let updatedImageUrl = current.image_url;

  if (req.file) {
    // Remove arquivo anterior se for upload local
    if (current.image_url && current.image_url.includes('/uploads/')) {
      const oldFile = current.image_url.split('/uploads/')[1];
      const oldPath = path.join(__dirname, '..', '..', 'uploads', oldFile);
      fs.unlink(oldPath, () => {});
    }
    updatedImageUrl = buildImageUrl(req.file.filename);
  }

  try {
    const result = await pool.query(
      `UPDATE products
         SET name=$1, description=$2, price=$3, image_url=$4, available=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [updatedName, updatedDescription, updatedPrice, updatedImageUrl, updatedAvailable, id]
    );
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/products/:id
 * Remove produto e deleta o arquivo de imagem local se houver.
 */
async function deleteProduct(req, res, next) {
  const { id } = req.params;
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'Invalid product id.' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const deleted = result.rows[0];
    if (deleted.image_url && deleted.image_url.includes('/uploads/')) {
      const filename = deleted.image_url.split('/uploads/')[1];
      const filepath = path.join(__dirname, '..', '..', 'uploads', filename);
      fs.unlink(filepath, () => {});
    }

    return res.status(200).json({ message: 'Product deleted successfully.', product: deleted });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
