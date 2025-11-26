import api from './api';
import Cookies from 'js-cookie';
import { AuthResponse, LoginCredentials, User } from '../types';

class AuthService {
  async loginWithAD(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login-ad', credentials);
    this.setSession(response);
    return response;
  }

  async loginLocal(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    this.setSession(response);
    return response;
  }

  logout(): void {
    Cookies.remove('access_token');
    Cookies.remove('user');
    window.location.href = '/login';
  }

  setSession(authResponse: AuthResponse): void {
    Cookies.set('access_token', authResponse.access_token, { expires: 1 }); // 1 day
    Cookies.set('user', JSON.stringify(authResponse.user), { expires: 1 });
  }

  getCurrentUser(): User | null {
    const userStr = Cookies.get('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!Cookies.get('access_token');
  }

  getToken(): string | undefined {
    return Cookies.get('access_token');
  }
}

export default new AuthService();
