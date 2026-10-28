-- Tabela de produtos do cardápio
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  description TEXT,
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url   VARCHAR(500),
  available   BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id           SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  status        VARCHAR(20)    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  total         NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Tabela de itens de cada pedido
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER        NOT NULL REFERENCES products(id),
  quantity   INTEGER        NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Produtos iniciais do cardápio
INSERT INTO products (name, description, price, available) VALUES
  ('X-Burguer',        'Hambúrguer artesanal com queijo, alface e tomate', 22.90, TRUE),
  ('X-Bacon',          'Hambúrguer com bacon crocante e queijo cheddar',   27.90, TRUE),
  ('Frango Grelhado',  'Sanduíche de frango grelhado com maionese verde',  21.90, TRUE),
  ('Batata Frita',     'Porção de batata frita crocante (300 g)',           12.90, TRUE),
  ('Onion Rings',      'Anéis de cebola empanados (200 g)',                 11.90, TRUE),
  ('Refrigerante',     'Lata 350 ml — Coca-Cola, Guaraná ou Sprite',        6.90, TRUE),
  ('Suco Natural',     'Copo 400 ml — Laranja, Maracujá ou Limão',          9.90, TRUE),
  ('Milkshake',        'Copo 450 ml — Chocolate, Morango ou Baunilha',     16.90, TRUE);
