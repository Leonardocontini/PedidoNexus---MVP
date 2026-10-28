const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Wrapper interno para fetch com tratamento de erros HTTP centralizado.
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
      // resposta sem corpo JSON — mantém mensagem genérica
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * Busca todos os pedidos ordenados pelo mais recente.
 * Cada pedido inclui o array `items` com product_name, quantity e unit_price.
 * @returns {Promise<Array>}
 */
export async function fetchOrders() {
  return request('/api/orders');
}

/**
 * Atualiza o status de um pedido.
 * @param {number} orderId
 * @param {string} status - 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
 * @returns {Promise<Object>} Pedido atualizado.
 */
export async function updateOrderStatus(orderId, status) {
  return request(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
