import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AdminPage from '../pages/admin/AdminPage';
import CustomerPage from '../pages/customer/CustomerPage';
import SellerPage from '../pages/seller/SellerPage';
import HomePage from '../pages/home/HomePage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/customer" element={<CustomerPage />} />
      <Route path="/seller" element={<SellerPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
