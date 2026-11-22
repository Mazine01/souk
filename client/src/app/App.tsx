import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CartProvider } from '../lib/cart';
import { AuthPage } from '../features/auth/AuthPage';
import { HomePage } from '../features/store/HomePage';
import { ShopPage } from '../features/store/ShopPage';
import { ProductPage } from '../features/store/ProductPage';
import { CheckoutPage } from '../features/orders/CheckoutPage';
import { OrderPage, OrdersPage } from '../features/orders/OrdersPages';
import { AdminHome, AdminLayout, AdminOrders, AdminProducts } from '../features/admin/AdminPages';
import { AppShell } from './AppShell';
import { LegalPage } from '../features/legal/LegalPage';
import type { DocKey } from '../features/legal/documents';

const Legal = ({ doc }: { doc: DocKey }) => (
  <div className="px-4 pt-10 sm:px-6">
    <LegalPage doc={doc} />
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <CartProvider>
      <ScrollToTop />
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/privacy" element={<Legal doc="privacy" />} />
          <Route path="/terms" element={<Legal doc="terms" />} />
          <Route path="/cookies" element={<Legal doc="cookies" />} />
          <Route path="/delivery-returns" element={<Legal doc="delivery" />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </CartProvider>
  );
}
