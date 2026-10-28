import OrderCard from './OrderCard';

export default function OrderColumn({ title, status, orders, onAdvance, onSelect, advancingId }) {
  return (
    <section className={`order-column order-column--${status}`} aria-label={title}>
      <div className="order-column__header">
        <h2 className="order-column__title">{title}</h2>
        <span className="order-column__count">{orders.length}</span>
      </div>

      <div className="order-column__list">
        {orders.length === 0 ? (
          <p className="order-column__empty">Nenhum pedido</p>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={onAdvance}
              onSelect={onSelect}
              advancing={advancingId === order.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
