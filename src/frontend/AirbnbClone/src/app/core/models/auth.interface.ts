export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
  phoneNumber?: string | null;
}

export interface GoogleAuthRequest {
  googleToken: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  token?: string;
  refreshToken: string;
  emailSent?: boolean; // Added for registration flow
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
  token?: string; // Make sure backend returns token
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  token: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string | null;
}

export interface ChangePasswordResponse {
  message: string;
  success: boolean;
}