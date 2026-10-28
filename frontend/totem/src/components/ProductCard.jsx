const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="40" fill="%23bbb" dominant-baseline="middle" text-anchor="middle"%3E🍽️%3C/text%3E%3C/svg%3E';

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function ProductCard({ product, onAdd }) {
  const imgSrc = product.image_url || PLACEHOLDER_IMAGE;

  return (
    <article className="product-card">
      <img
        className="product-card__image"
        src={imgSrc}
        alt={product.name}
        onError={(e) => {
          e.currentTarget.src = PLACEHOLDER_IMAGE;
        }}
      />
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        {product.description && (
          <p className="product-card__description">{product.description}</p>
        )}
        <div className="product-card__footer">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          <button
            className="product-card__add-btn"
            onClick={() => onAdd(product)}
            aria-label={`Adicionar ${product.name} ao carrinho`}
          >
            Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}
