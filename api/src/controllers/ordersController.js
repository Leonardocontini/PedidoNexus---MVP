'use strict';

const pool = require('../config/database');

const VALID_STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

/**
 * POST /api/orders
 * Cria um novo pedido com seus itens em uma única transação.
 * O total é calculado a partir dos preços registrados no banco de dados.
 */
async function createOrder(req, res, next) {
  const { customer_name, items } = req.body;

  // Validação básica do payload
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'An order must contain at least one item.' });
  }

  for (const [index, item] of items.entries()) {
    if (!item.product_id || !Number.isInteger(Number(item.product_id)) || Number(item.product_id) <= 0) {
      return res.status(400).json({ error: `Item at index ${index} has an invalid product_id.` });
    }
    if (!item.quantity || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({ error: `Item at index ${index} has an invalid quantity (must be a positive integer).` });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Busca os preços dos produtos solicitados — ignora qualquer preço vindo do cliente
    const productIds = items.map((i) => Number(i.product_id));
    const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(', ');

    const productsResult = await client.query(
      `SELECT id, price, available FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    // Mapeia id -> produto para checagem rápida
    const productsMap = {};
    for (const row of productsResult.rows) {
      productsMap[row.id] = row;
    }

    // Verifica se todos os produtos existem e estão disponíveis
    for (const [index, item] of items.entries()) {
      const product = productsMap[Number(item.product_id)];
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product with id ${item.product_id} not found.` });
      }
      if (!product.available) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product with id ${item.product_id} is not available.` });
      }
    }

    // Calcula o total usando os preços do banco
    let total = 0;
    for (const item of items) {
      const product = productsMap[Number(item.product_id)];
      total += parseFloat(product.price) * Number(item.quantity);
    }
    total = parseFloat(total.toFixed(2));

    // Insere o pedido
    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, total) VALUES ($1, $2) RETURNING *`,
      [customer_name || null, total]
    );
    const order = orderResult.rows[0];

    // Insere os itens do pedido
    const insertedItems = [];
    for (const item of items) {
      const product = productsMap[Number(item.product_id)];
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [order.id, Number(item.product_id), Number(item.quantity), product.price]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(201).json({ ...order, items: insertedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    return next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/orders
 * Lista todos os pedidos ordenados pelo mais recente.
 */
async function listOrders(req, res, next) {
  try {
    const ordersResult = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );

    const orders = ordersResult.rows;

    if (orders.length === 0) {
      return res.status(200).json([]);
    }

    // Busca todos os itens dos pedidos retornados em uma única consulta
    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map((_, idx) => `$${idx + 1}`).join(', ');

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${placeholders})`,
      orderIds
    );

    // Agrupa itens por pedido
    const itemsByOrder = {};
    for (const item of itemsResult.rows) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }

    const result = orders.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/orders/:id
 * Retorna um pedido específico com seus itens.
 */
async function getOrder(req, res, next) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'Invalid order id.' });
  }

  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    );

    return res.status(200).json({ ...order, items: itemsResult.rows });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/orders/:id/status
 * Atualiza o status de um pedido.
 */
async function updateOrderStatus(req, res, next) {
  const { id } = req.params;
  const { status } = req.body;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ error: 'Invalid order id.' });
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
}

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };
