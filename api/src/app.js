'use strict';

require('dotenv').config();

const express = require('express');
const path    = require('path');
const pool    = require('./config/database');
const productsRoutes = require('./routes/productsRoutes');
const ordersRoutes   = require('./routes/ordersRoutes');

const app  = express();
const PORT = process.env.API_PORT || 3000;

// CORS — permite requisições do frontend (totem e painel do restaurante)
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

// Serve imagens enviadas via upload em /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
app.use('/api/orders',   ordersRoutes);

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Tratamento centralizado de erros
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 5 MB.' });
  }
  if (err.message && err.message.includes('Tipo de arquivo')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`PedidoNexus API running on port ${PORT}`);
});
