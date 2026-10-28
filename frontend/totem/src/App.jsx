import { useState, useEffect } from 'react';
import { fetchProducts } from './services/api';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import OrderConfirmation from './components/OrderConfirmation';

// Visualizações possíveis da aplicação
const VIEW = {
  MENU: 'menu',           // cardápio com carrinho fechado
  CART: 'cart',           // carrinho aberto
  CHECKOUT: 'checkout',   // tela de confirmação do pedido
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cada item do carrinho: { product, quantity }
  const [cartItems, setCartItems] = useState([]);
  const [view, setView] = useState(VIEW.MENU);

  // Busca o cardápio uma vez ao montar o componente
  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // --- operações do carrinho ---

  function addToCart(product) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function increaseQty(productId) {
    setCartItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }

  function decreaseQty(productId) {
    setCartItems((prev) => {
      const item = prev.find((i) => i.product.id === productId);
      if (!item) return prev;
      if (item.quantity === 1) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }

  function removeFromCart(productId) {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function clearCart() {
    setCartItems([]);
  }

  // Chamado pelo OrderConfirmation após sucesso no backend
  function handleOrderSuccess() {
    clearCart();
    // mantém a tela de confirmação mostrando o sucesso (o componente gerencia isso internamente)
  }

  // Após o usuário clicar em "Fazer Novo Pedido" na tela de sucesso
  function handleBackToMenu() {
    setView(VIEW.MENU);
  }

  const totalItemsInCart = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="app">
      <Header
        cartCount={totalItemsInCart}
        onCartClick={() => setView(VIEW.CART)}
      />

      <main className="main">
        <div className="main__content">
          <h1 className="main__title">Cardápio</h1>
          <ProductGrid
            products={products}
            loading={loading}
            error={error}
            onAdd={addToCart}
          />
        </div>
      </main>

      {view === VIEW.CART && (
        <Cart
          items={cartItems}
          onIncrease={increaseQty}
          onDecrease={decreaseQty}
          onRemove={removeFromCart}
          onCheckout={() => setView(VIEW.CHECKOUT)}
          onClose={() => setView(VIEW.MENU)}
        />
      )}

      {view === VIEW.CHECKOUT && (
        <OrderConfirmation
          cartItems={cartItems}
          onBack={() => setView(VIEW.CART)}
          onSuccess={handleOrderSuccess}
        />
      )}
    </div>
  );
}
