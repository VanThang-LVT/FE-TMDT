import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AdminPage from '../pages/admin/AdminPage';
import AdminCategoryPage from '../pages/admin/AdminCategoryPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminBannerPage from '../pages/admin/AdminBannerPage';
import AdminCommissionPage from '../pages/admin/AdminCommissionPage';
import AdminPaymentPage from '../pages/admin/AdminPaymentPage';
import ProfilePage from '../pages/customer/ProfilePage';
import OrdersPage from '../pages/customer/OrdersPage';
import ShopRegistrationPage from '../pages/customer/ShopRegistrationPage';
import SellerPage from '../pages/seller/SellerPage';
import SellerProductsPage from '../pages/seller/SellerProductsPage';
import HomePage from '../pages/home/HomePage';
import ProductDetailPage from '../pages/product/ProductDetailPage';
import CategoryPage from '../pages/category/CategoryPage';
import CartPage from '../pages/cart/CartPage';
import CheckoutPage from '../pages/checkout/CheckoutPage';
import PaymentReturnPage from '../pages/checkout/PaymentReturnPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/category/:categoryId" element={<CategoryPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment-return" element={<PaymentReturnPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protect Customer Profile */}
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/history" element={<OrdersPage />} />

      {/* Protect Shop Registration */}
      <Route path="/register-shop" element={<ShopRegistrationPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/categories" element={<AdminCategoryPage />} />
      <Route path="/admin/products" element={<AdminProductsPage />} />
      <Route path="/admin/banners" element={<AdminBannerPage />} />
      <Route path="/admin/commissions" element={<AdminCommissionPage />} />
      <Route path="/admin/payments" element={<AdminPaymentPage />} />

      {/* Seller Routes */}
      <Route path="/seller" element={<SellerPage />} />
      <Route path="/seller/products" element={<SellerProductsPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
