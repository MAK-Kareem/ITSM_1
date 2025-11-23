import api from './api';
import { Ticket } from '../types';

class TicketService {
  async getAll(): Promise<Ticket[]> {
    return api.get<Ticket[]>('/helpdesk/tickets');
  }

  async getById(id: number): Promise<Ticket> {
    return api.get<Ticket>(`/helpdesk/tickets/${id}`);
  }

  async create(ticket: Partial<Ticket>): Promise<Ticket> {
    return api.post<Ticket>('/helpdesk/tickets', ticket);
  }

  async update(id: number, ticket: Partial<Ticket>): Promise<Ticket> {
    return api.patch<Ticket>(`/helpdesk/tickets/${id}`, ticket);
  }

  async getStats(): Promise<any> {
    return api.get('/helpdesk/tickets/stats');
  }
}

export default new TicketService();
