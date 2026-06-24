import { API_BASE_URL } from '../utils/constants';

export const loginApi = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
  }
  return data;
};

export const registerApi = async (fullName, email, password, phone, otp) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fullName, email, password, phone, otp }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Đăng ký tài khoản thất bại!');
  }
  return data;
};

export const sendRegisterOtpApi = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/send-register-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể gửi mã OTP!');
  }
  return data;
};

export const sendForgotPasswordOtpApi = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/send-forgot-password-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Không thể gửi mã OTP khôi phục mật khẩu!');
  }
  return data;
};

export const resetPasswordApi = async (email, otp, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp, newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Đặt lại mật khẩu thất bại!');
  }
  return data;
};
