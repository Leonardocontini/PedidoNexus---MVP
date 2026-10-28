export default function Header({ cartCount, onCartClick }) {
  return (
    <header className="header">
      <div className="header__brand">
        <img
          src="/logo.png"
          alt="PedidoNexus"
          className="header__logo-img"
        />
      </div>

      <button
        className="header__cart-btn"
        onClick={onCartClick}
        aria-label={`Abrir carrinho — ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
      >
        <span className="header__cart-icon">🛒</span>
        <span className="header__cart-label">Carrinho</span>
        {cartCount > 0 && (
          <span className="header__cart-badge" aria-hidden="true">
            {cartCount}
          </span>
        )}
      </button>
    </header>
  );
}
