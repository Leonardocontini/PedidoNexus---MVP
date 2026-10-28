// Mapa de transições válidas: status atual → próximo status permitido
const NEXT_STATUS = {
  pending:   { status: 'preparing', label: 'Iniciar Preparo' },
  preparing: { status: 'ready',     label: 'Marcar como Pronto' },
  ready:     { status: 'delivered', label: 'Confirmar Entrega' },
};

const STATUS_LABEL = {
  pending:   'Pendente',
  preparing: 'Preparando',
  ready:     'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderCard({ order, onAdvance, onSelect, advancing }) {
  const next = NEXT_STATUS[order.status];

  return (
    <article
      className={`order-card order-card--${order.status}`}
      onClick={() => onSelect(order)}
      role="button"
      tabIndex={0}
      aria-label={`Pedido #${order.id} — ${STATUS_LABEL[order.status]}`}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(order)}
    >
      <div className="order-card__header">
        <span className="order-card__id">#{order.id}</span>
        <span className="order-card__time">{formatTime(order.created_at)}</span>
      </div>

      {order.customer_name && (
        <p className="order-card__customer">👤 {order.customer_name}</p>
      )}

      <ul className="order-card__items">
        {(order.items || []).map((item) => (
          <li key={item.id} className="order-card__item">
            <span className="order-card__item-qty">{item.quantity}×</span>
            <span className="order-card__item-name">{item.product_name}</span>
          </li>
        ))}
      </ul>

      <div className="order-card__footer">
        <span className="order-card__total">{formatPrice(order.total)}</span>

        {next && (
          <button
            className="order-card__action-btn"
            onClick={(e) => {
              e.stopPropagation(); // não abre detalhes ao clicar no botão
              onAdvance(order.id, next.status);
            }}
            disabled={advancing}
            aria-label={`${next.label} — pedido #${order.id}`}
          >
            {advancing ? '...' : next.label}
          </button>
        )}
      </div>
    </article>
  );
}
