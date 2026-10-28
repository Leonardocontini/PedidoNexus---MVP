'use strict';

require('dotenv').config();

const express = require('express');
const pool = require('./config/database');
const productsRoutes = require('./routes/productsRoutes');
const ordersRoutes = require('./routes/ordersRoutes');

const app = express();
const PORT = process.env.API_PORT || 3000;

// CORS — permite requisições do frontend (totem e painel do restaurante)
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

// Middlewares globais
app.use(express.json());

// Health check — verifica a API e a conexão com o banco
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    return res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

// Rotas da aplicação
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Tratamento centralizado de erros
// O Express identifica este middleware pelos 4 parâmetros (err, req, res, next)
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Registra o erro internamente sem expor detalhes ao cliente
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`PedidoNexus API running on port ${PORT}`);
});
