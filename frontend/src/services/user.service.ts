import api from './api';
import { User } from '../types';

class UserService {
  /**
   * Get all active users (for Asset Owner and Assigned To fields)
   */
  async getAll(): Promise<User[]> {
    return api.get<User[]>('/auth/users');
  }

  /**
   * Get users who are members of ITManager AD group (for Asset Manager field)
   */
  async getITManagers(): Promise<User[]> {
    return api.get<User[]>('/auth/users/it-managers');
  }
}

export default new UserService();
