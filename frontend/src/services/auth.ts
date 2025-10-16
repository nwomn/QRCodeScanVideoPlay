import api from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  username: string;
}

export const login = async (payload: LoginRequest) => {
  const response = await api.post<LoginResponse>('/auth/login', payload);
  return response.data;
};
