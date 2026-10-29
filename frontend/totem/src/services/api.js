const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Wrapper interno para fetch com tratamento de erros HTTP centralizado.
 * Lança um Error com a mensagem do backend quando o status não é 2xx.
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
  }

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // resposta sem corpo JSON — mantém a mensagem genérica
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * Busca todos os produtos disponíveis no cardápio.
 * @returns {Promise<Array>} Lista de produtos.
 */
export async function fetchProducts() {
  return request('/api/products?available=true');
}

/**
 * Envia um novo pedido para a API.
 * Os preços são calculados no backend; o frontend envia apenas product_id e quantity.
 *
 * @param {{ customer_name?: string, items: Array<{ product_id: number, quantity: number }> }} payload
 * @returns {Promise<Object>} Pedido criado com id, total e itens.
 */
export async function createOrder(payload) {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
