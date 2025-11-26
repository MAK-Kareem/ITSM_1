import api from './api';
import { Asset } from '../types';

class AssetService {
  async getAll(): Promise<Asset[]> {
    return api.get<Asset[]>('/assets');
  }

  async getById(id: number): Promise<Asset> {
    return api.get<Asset>(`/assets/${id}`);
  }

  async create(asset: Partial<Asset>): Promise<Asset> {
    return api.post<Asset>('/assets', asset);
  }

  async update(id: number, asset: Partial<Asset>): Promise<Asset> {
    return api.patch<Asset>(`/assets/${id}`, asset);
  }

  async delete(id: number): Promise<void> {
    return api.delete(`/assets/${id}`);
  }
}

export default new AssetService();
