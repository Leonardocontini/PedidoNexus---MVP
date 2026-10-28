import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrders, updateOrderStatus } from './services/api';
import Header from './components/Header';
import OrderColumn from './components/OrderColumn';
import OrderDetails from './components/OrderDetails';

const POLL_INTERVAL_MS = 5000;

// Status exibidos nas colunas ativas do kanban
const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'];

export default function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [advancingId, setAdvancingId] = useState(null);
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

  // Referência para evitar chamadas simultâneas de polling
  const fetchingRef = useRef(false);

  // Busca os pedidos e atualiza o estado sem causar flicker
  const loadOrders = useCallback(async (silent = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (!silent) setSyncing(true);

    try {
      const data = await fetchOrders();
      setOrders(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Polling a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => loadOrders(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Exibe toast e remove após 3 segundos
  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAdvance(orderId, nextStatus) {
    setAdvancingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      // Atualiza o pedido localmente de imediato sem esperar o próximo poll
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
      // Atualiza o modal se estiver aberto no mesmo pedido
      setSelectedOrder((prev) =>
        prev?.id === updated.id ? { ...prev, ...updated } : prev
      );
      showToast(`Pedido #${orderId} atualizado para "${nextStatus}".`);
    } catch (err) {
      showToast(`Falha ao atualizar pedido #${orderId}: ${err.message}`, 'error');
    } finally {
      setAdvancingId(null);
    }
  }

  // Agrupa pedidos por status
  const byStatus = ACTIVE_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s);
    return acc;
  }, {});

  const history = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled'
  );

  const counts = {
    pending:   byStatus.pending.length,
    preparing: byStatus.preparing.length,
    ready:     byStatus.ready.length,
  };

  // Tela de carregamento inicial
  if (loading) {
    return (
      <div className="app app--loading">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header counts={counts} lastUpdated={lastUpdated} syncing={syncing} />

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => loadOrders()} className="error-banner__retry">
            Tentar novamente
          </button>
        </div>
      )}

      <main className="main">
        <div className="kanban">
          <OrderColumn
            title="Pendentes"
            status="pending"
            orders={byStatus.pending}
            onAdvance={handleAdvance}
            onSelect={setSelectedOrder}
            advancingId={advancingId}
          />
          <OrderColumn
            title="Preparando"
            status="preparing"
            orders={byStatus.preparing}
            onAdvance={handleAdvance}
            onSelect={setSelectedOrder}
            advancingId={advancingId}
          />
          <OrderColumn
            title="Prontos"
            status="ready"
            orders={byStatus.ready}
            onAdvance={handleAdvance}
            onSelect={setSelectedOrder}
            advancingId={advancingId}
          />
        </div>

        {history.length > 0 && (
          <section className="history">
            <h2 className="history__title">
              Histórico — entregues e cancelados ({history.length})
            </h2>
            <div className="history__list">
              {history.map((order) => (
                <button
                  key={order.id}
                  className={`history__item history__item--${order.status}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <span className="history__item-id">#{order.id}</span>
                  {order.customer_name && (
                    <span className="history__item-customer">{order.customer_name}</span>
                  )}
                  <span className={`history__item-status history__item-status--${order.status}`}>
                    {order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                  </span>
                  <span className="history__item-total">
                    {Number(order.total).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAdvance={async (id, status) => {
            await handleAdvance(id, status);
            setSelectedOrder(null);
          }}
          advancing={advancingId === selectedOrder.id}
        />
      )}

      {toast && (
        <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
}
