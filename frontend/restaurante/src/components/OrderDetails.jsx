const STATUS_LABEL = {
  pending:   'Pendente',
  preparing: 'Preparando',
  ready:     'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const NEXT_STATUS = {
  pending:   { status: 'preparing', label: 'Iniciar Preparo' },
  preparing: { status: 'ready',     label: 'Marcar como Pronto' },
  ready:     { status: 'delivered', label: 'Confirmar Entrega' },
};

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderDetails({ order, onClose, onAdvance, advancing }) {
  const next = NEXT_STATUS[order.status];

  return (
    <div
      className="details-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes do pedido #${order.id}`}
      onClick={onClose}
    >
      <div className="details" onClick={(e) => e.stopPropagation()}>
        <div className="details__header">
          <div>
            <h2 className="details__title">Pedido #{order.id}</h2>
            <span className={`details__status details__status--${order.status}`}>
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <button className="details__close-btn" onClick={onClose} aria-label="Fechar detalhes">
            ✕
          </button>
        </div>

        <dl className="details__meta">
          <div className="details__meta-row">
            <dt>Criado em</dt>
            <dd>{formatDateTime(order.created_at)}</dd>
          </div>
          {order.customer_name && (
            <div className="details__meta-row">
              <dt>Cliente</dt>
              <dd>{order.customer_name}</dd>
            </div>
          )}
        </dl>

        <h3 className="details__section-title">Itens do pedido</h3>
        <ul className="details__item-list">
          {(order.items || []).map((item) => (
            <li key={item.id} className="details__item">
              <span className="details__item-qty">{item.quantity}×</span>
              <span className="details__item-name">{item.product_name}</span>
              <span className="details__item-price">
                {formatPrice(Number(item.unit_price) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="details__total">
          <span>Total</span>
          <strong>{formatPrice(order.total)}</strong>
        </div>

        {next && (
          <button
            className="details__action-btn"
            onClick={() => onAdvance(order.id, next.status)}
            disabled={advancing}
          >
            {advancing ? 'Atualizando...' : next.label}
          </button>
        )}
      </div>
    </div>
  );
}
