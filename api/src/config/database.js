'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.POSTGRES_HOST,
  port:     Number(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB,
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

pool.on('error', (err) => {
  // Registra erros inesperados no pool sem expor credenciais
  console.error('Unexpected error on idle database client:', err.message);
});

module.exports = pool;
