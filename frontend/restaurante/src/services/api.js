const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Wrapper para requisições JSON.
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
    } catch { /* sem corpo JSON */ }
    throw new Error(message);
  }
  return response.json();
}

/**
 * Wrapper para requisições multipart/form-data (upload de imagem).
 * Não define Content-Type — o browser inclui o boundary automaticamente.
 */
async function requestForm(path, method, formData) {
  const url = `${BASE_URL}${path}`;
  let response;
  try {
    response = await fetch(url, { method, body: formData });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
  }
  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch { /* sem corpo JSON */ }
    throw new Error(message);
  }
  return response.json();
}

// ── Pedidos ──────────────────────────────────────────────────────────────────

export async function fetchOrders() {
  return request('/api/orders');
}

export async function updateOrderStatus(orderId, status) {
  return request(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Produtos ─────────────────────────────────────────────────────────────────

/** Lista todos os produtos (disponíveis e indisponíveis). */
export async function fetchProducts() {
  return request('/api/products');
}

/** Cria um produto. formData deve conter os campos e opcionalmente o campo `image`. */
export async function createProduct(formData) {
  return requestForm('/api/products', 'POST', formData);
}

/** Atualiza um produto existente. */
export async function updateProduct(productId, formData) {
  return requestForm(`/api/products/${productId}`, 'PUT', formData);
}

/** Remove um produto. */
export async function deleteProduct(productId) {
  return request(`/api/products/${productId}`, { method: 'DELETE' });
}
