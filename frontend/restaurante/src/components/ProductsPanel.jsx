import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/api';
import ProductForm from './ProductForm';

const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="48"' +
  ' viewBox="0 0 64 48"%3E%3Crect width="64" height="48" fill="%23f0f0f0"/%3E' +
  '%3Ctext x="50%25" y="50%25" font-size="20" fill="%23bbb"' +
  ' dominant-baseline="middle" text-anchor="middle"%3E🍽️%3C/text%3E%3C/svg%3E';

function formatPrice(p) {
  return Number(p).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ProductsPanel({ onToast }) {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [formTarget, setFormTarget] = useState(null); // null=fechado | 'new' | produto
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(formData) {
    setSaving(true);
    try {
      if (formTarget === 'new') {
        await createProduct(formData);
        onToast('Produto criado com sucesso.');
      } else {
        await updateProduct(formTarget.id, formData);
        onToast('Produto atualizado.');
      }
      setFormTarget(null);
      await load();
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Remover "${product.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      onToast(`"${product.name}" removido.`);
      await load();
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="pp-state">
        <div className="loading-spinner" />
        <p>Carregando produtos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-state pp-state--error">
        <p>⚠️ {error}</p>
        <button className="pp-retry" onClick={load}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="pp">
      <div className="pp__toolbar">
        <span className="pp__count">
          {products.length} produto{products.length !== 1 ? 's' : ''}
        </span>
        <button className="pp__new-btn" onClick={() => setFormTarget('new')}>
          + Novo produto
        </button>
      </div>

      <div className="pp__table-wrap">
        <table className="pp__table">
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Preço</th>
              <th>Disponível</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="pp__empty">Nenhum produto cadastrado.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={!p.available ? 'pp__row--off' : ''}>
                  <td>
                    <img
                      className="pp__thumb"
                      src={p.image_url || PLACEHOLDER}
                      alt={p.name}
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                    />
                  </td>
                  <td className="pp__cell-name">{p.name}</td>
                  <td className="pp__cell-desc">
                    {p.description || <span className="pp__dash">—</span>}
                  </td>
                  <td className="pp__cell-price">{formatPrice(p.price)}</td>
                  <td>
                    <span className={`pp__badge ${p.available ? 'pp__badge--yes' : 'pp__badge--no'}`}>
                      {p.available ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="pp__cell-actions">
                    <button
                      className="pp__btn-edit"
                      onClick={() => setFormTarget(p)}
                      aria-label={`Editar ${p.name}`}
                    >
                      Editar
                    </button>
                    <button
                      className="pp__btn-delete"
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      aria-label={`Remover ${p.name}`}
                    >
                      {deletingId === p.id ? '...' : 'Remover'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {formTarget !== null && (
        <ProductForm
          product={formTarget === 'new' ? null : formTarget}
          onSave={handleSave}
          onCancel={() => setFormTarget(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
