export default function Header({ counts, lastUpdated, syncing, activeTab, onTabChange }) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <header className="header">
      <div className="header__brand">
        <img src="/logo.png" alt="PedidoNexus" className="header__logo-img" />
        <span className="header__subtitle">Painel do Restaurante</span>
      </div>

      <nav className="header__tabs" aria-label="Seções do painel">
        <button
          className={`header__tab ${activeTab === 'orders' ? 'header__tab--active' : ''}`}
          onClick={() => onTabChange('orders')}
        >
          📋 Pedidos
        </button>
        <button
          className={`header__tab ${activeTab === 'products' ? 'header__tab--active' : ''}`}
          onClick={() => onTabChange('products')}
        >
          🍽️ Cardápio
        </button>
      </nav>

      {activeTab === 'orders' && (
        <div className="header__stats">
          <span className="header__stat header__stat--pending">
            {counts.pending} pendente{counts.pending !== 1 ? 's' : ''}
          </span>
          <span className="header__stat header__stat--preparing">
            {counts.preparing} preparando
          </span>
          <span className="header__stat header__stat--ready">
            {counts.ready} pronto{counts.ready !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="header__sync">
        <span className={`header__sync-dot ${syncing ? 'header__sync-dot--active' : ''}`} />
        <span className="header__sync-time">Atualizado {timeStr}</span>
      </div>
    </header>
  );
}
