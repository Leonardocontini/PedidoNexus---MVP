function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function Cart({ items, onIncrease, onDecrease, onRemove, onCheckout, onClose }) {
  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <div className="cart-overlay" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
      <div className="cart">
        <div className="cart__header">
          <h2 className="cart__title">🛒 Seu Pedido</h2>
          <button
            className="cart__close-btn"
            onClick={onClose}
            aria-label="Fechar carrinho"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart__empty">
            <span className="cart__empty-icon">🛒</span>
            <p>Seu carrinho está vazio.</p>
            <p>Adicione itens do cardápio para começar.</p>
          </div>
        ) : (
          <>
            <ul className="cart__list">
              {items.map((item) => (
                <li key={item.product.id} className="cart__item">
                  <div className="cart__item-info">
                    <span className="cart__item-name">{item.product.name}</span>
                    <span className="cart__item-subtotal">
                      {formatPrice(Number(item.product.price) * item.quantity)}
                    </span>
                  </div>
                  <div className="cart__item-controls">
                    <button
                      className="cart__qty-btn"
                      onClick={() => onDecrease(item.product.id)}
                      aria-label={`Diminuir quantidade de ${item.product.name}`}
                    >
                      −
                    </button>
                    <span className="cart__qty">{item.quantity}</span>
                    <button
                      className="cart__qty-btn"
                      onClick={() => onIncrease(item.product.id)}
                      aria-label={`Aumentar quantidade de ${item.product.name}`}
                    >
                      +
                    </button>
                    <button
                      className="cart__remove-btn"
                      onClick={() => onRemove(item.product.id)}
                      aria-label={`Remover ${item.product.name} do carrinho`}
                    >
                      🗑
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart__footer">
              <div className="cart__total">
                <span>Total estimado</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <p className="cart__total-note">
                O valor final é calculado e confirmado pelo sistema.
              </p>
              <button className="cart__checkout-btn" onClick={onCheckout}>
                Finalizar Pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
