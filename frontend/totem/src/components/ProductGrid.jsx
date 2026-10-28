import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, error, onAdd }) {
  if (loading) {
    return (
      <div className="state-message">
        <span className="state-message__icon">⏳</span>
        <p>Carregando cardápio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-message state-message--error">
        <span className="state-message__icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="state-message">
        <span className="state-message__icon">🍽️</span>
        <p>Nenhum produto disponível no momento.</p>
      </div>
    );
  }

  return (
    <section className="product-grid" aria-label="Cardápio">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))}
    </section>
  );
}
