import { useState } from 'react';
import { createOrder } from '../services/api';

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Estado da tela de confirmação
const STEP = {
  FORM: 'form',       // resumo + campo de nome
  SENDING: 'sending', // aguardando resposta da API
  SUCCESS: 'success', // pedido criado com sucesso
  ERROR: 'error',     // falha no envio
};

export default function OrderConfirmation({ cartItems, onBack, onSuccess }) {
  const [customerName, setCustomerName] = useState('');
  const [step, setStep] = useState(STEP.FORM);
  const [order, setOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  async function handleConfirm() {
    setStep(STEP.SENDING);
    setErrorMessage('');

    const payload = {
      customer_name: customerName.trim() || undefined,
      items: cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      const createdOrder = await createOrder(payload);
      setOrder(createdOrder);
      setStep(STEP.SUCCESS);
      // Informa o componente pai para limpar o carrinho somente após sucesso
      onSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao enviar o pedido. Tente novamente.');
      setStep(STEP.ERROR);
    }
  }

  // Tela de carregamento
  if (step === STEP.SENDING) {
    return (
      <div className="confirmation-overlay">
        <div className="confirmation">
          <div className="state-message">
            <span className="state-message__icon">⏳</span>
            <p>Enviando seu pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de sucesso
  if (step === STEP.SUCCESS && order) {
    return (
      <div className="confirmation-overlay">
        <div className="confirmation confirmation--success">
          <div className="confirmation__success-icon">✅</div>
          <h2 className="confirmation__title">Pedido Confirmado!</h2>
          <div className="confirmation__order-number">
            <span>Número do pedido</span>
            <strong>#{order.id}</strong>
          </div>
          {order.customer_name && (
            <p className="confirmation__customer">
              Olá, <strong>{order.customer_name}</strong>! Acompanhe seu pedido pelo número acima.
            </p>
          )}
          <p className="confirmation__total">
            Total cobrado: <strong>{formatPrice(order.total)}</strong>
          </p>
          <p className="confirmation__status-info">
            Seu pedido está sendo preparado. Aguarde a chamada.
          </p>
          <button
            className="confirmation__new-order-btn"
            onClick={onBack}
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (step === STEP.ERROR) {
    return (
      <div className="confirmation-overlay">
        <div className="confirmation confirmation--error">
          <div className="confirmation__error-icon">❌</div>
          <h2 className="confirmation__title">Não foi possível enviar o pedido</h2>
          <p className="confirmation__error-message">{errorMessage}</p>
          <div className="confirmation__error-actions">
            <button
              className="confirmation__retry-btn"
              onClick={handleConfirm}
            >
              Tentar novamente
            </button>
            <button
              className="confirmation__back-btn"
              onClick={() => setStep(STEP.FORM)}
            >
              Voltar ao resumo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela principal: formulário de confirmação
  return (
    <div className="confirmation-overlay">
      <div className="confirmation">
        <div className="confirmation__header">
          <button
            className="confirmation__back-btn"
            onClick={onBack}
            aria-label="Voltar ao carrinho"
          >
            ← Voltar
          </button>
          <h2 className="confirmation__title">Confirmar Pedido</h2>
        </div>

        <div className="confirmation__name-field">
          <label htmlFor="customer-name" className="confirmation__label">
            Seu nome (opcional)
          </label>
          <input
            id="customer-name"
            type="text"
            className="confirmation__input"
            placeholder="Ex: Maria"
            maxLength={100}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <h3 className="confirmation__summary-title">Resumo do pedido</h3>
        <ul className="confirmation__item-list">
          {cartItems.map((item) => (
            <li key={item.product.id} className="confirmation__item">
              <span className="confirmation__item-qty">{item.quantity}×</span>
              <span className="confirmation__item-name">{item.product.name}</span>
              <span className="confirmation__item-price">
                {formatPrice(Number(item.product.price) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="confirmation__total">
          <span>Total estimado</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <p className="confirmation__total-note">
          O valor final é calculado pelo sistema com base nos preços cadastrados.
        </p>

        <button
          className="confirmation__confirm-btn"
          onClick={handleConfirm}
        >
          Confirmar Pedido
        </button>
      </div>
    </div>
  );
}
