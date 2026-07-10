import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import AdminPage from '../pages/admin/AdminPage';
import AdminCategoryPage from '../pages/admin/AdminCategoryPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminBannerPage from '../pages/admin/AdminBannerPage';
import AdminCommissionPage from '../pages/admin/AdminCommissionPage';
import AdminEmailLogPage from '../pages/admin/AdminEmailLogPage';
import AdminPaymentPage from '../pages/admin/AdminPaymentPage';
import AdminVoucherPage from '../pages/admin/AdminVoucherPage';
import AdminVoucherHistoryPage from '../pages/admin/AdminVoucherHistoryPage';
import AdminReconciliationPage from '../pages/admin/AdminReconciliationPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminShopsPage from '../pages/admin/AdminShopsPage';
import ProfilePage from '../pages/customer/ProfilePage';
import ChangePasswordPage from '../pages/customer/ChangePasswordPage';
import OrdersPage from '../pages/customer/OrdersPage';
import ShopRegistrationPage from '../pages/customer/ShopRegistrationPage';
import SellerPage from '../pages/seller/SellerPage';
import SellerProductsPage from '../pages/seller/SellerProductsPage';
import SellerOrdersPage from '../pages/seller/SellerOrdersPage';
import SellerReviewsPage from '../pages/seller/SellerReviewsPage';
import SellerReconciliationPage from '../pages/seller/SellerReconciliationPage';
import HomePage from '../pages/home/HomePage';
import ProductDetailPage from '../pages/product/ProductDetailPage';
import CategoryPage from '../pages/category/CategoryPage';
import CartPage from '../pages/cart/CartPage';
import CheckoutPage from '../pages/checkout/CheckoutPage';
import PaymentReturnPage from '../pages/checkout/PaymentReturnPage';
import PublicShopPage from '../pages/shop/PublicShopPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/category/:categoryId" element={<CategoryPage />} />
      <Route path="/shop/:shopId" element={<PublicShopPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment-return" element={<PaymentReturnPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Protect Customer Profile */}
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
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
      <Route path="/admin/email-logs" element={<AdminEmailLogPage />} />
      <Route path="/admin/payments" element={<AdminPaymentPage />} />
      <Route path="/admin/vouchers" element={<AdminVoucherPage />} />
      <Route path="/admin/voucher-history" element={<AdminVoucherHistoryPage />} />
      <Route path="/admin/reconciliation" element={<AdminReconciliationPage />} />
      <Route path="/admin/orders" element={<AdminOrdersPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/shops" element={<AdminShopsPage />} />

      {/* Seller Routes */}
      <Route path="/seller" element={<SellerPage />} />
      <Route path="/seller/products" element={<SellerProductsPage />} />
      <Route path="/seller/orders" element={<SellerOrdersPage />} />
      <Route path="/seller/reviews" element={<SellerReviewsPage />} />
      <Route path="/seller/reconciliation" element={<SellerReconciliationPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
