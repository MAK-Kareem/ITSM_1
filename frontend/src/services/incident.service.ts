import api from './api';
import { Incident } from '../types';

class IncidentService {
  async getAll(): Promise<Incident[]> {
    return api.get<Incident[]>('/incidents');
  }

  async getById(id: number): Promise<Incident> {
    return api.get<Incident>(`/incidents/${id}`);
  }

  async create(incident: Partial<Incident>): Promise<Incident> {
    return api.post<Incident>('/incidents', incident);
  }

  async update(id: number, incident: Partial<Incident>): Promise<Incident> {
    return api.patch<Incident>(`/incidents/${id}`, incident);
  }

  async getMetrics(): Promise<any> {
    return api.get('/incidents/metrics');
  }
}

export default new IncidentService();
