import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AdminPage from '../pages/admin/AdminPage';
import AdminCategoryPage from '../pages/admin/AdminCategoryPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import ProfilePage from '../pages/customer/ProfilePage';
import ShopRegistrationPage from '../pages/customer/ShopRegistrationPage';
import SellerPage from '../pages/seller/SellerPage';
import SellerProductsPage from '../pages/seller/SellerProductsPage';
import HomePage from '../pages/home/HomePage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/categories" element={<AdminCategoryPage />} />
      <Route path="/admin/products" element={<AdminProductsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/register-shop" element={<ShopRegistrationPage />} />
      <Route path="/seller" element={<SellerPage />} />
      <Route path="/seller/products" element={<SellerProductsPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
