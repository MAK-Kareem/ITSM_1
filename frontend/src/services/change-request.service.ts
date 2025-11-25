import api from './api';
import { ChangeRequest, CRHistory, CRApproval, CRTestingResult, CRQAChecklist, CRDeploymentTeamMember } from '../types/change-request.types';

class ChangeRequestService {
  // Basic CRUD operations
  async getAll(): Promise<ChangeRequest[]> {
    return api.get<ChangeRequest[]>('/change-requests');
  }

  async getById(id: number): Promise<ChangeRequest> {
    return api.get<ChangeRequest>(`/change-requests/${id}`);
  }

  async getMyRequests(): Promise<ChangeRequest[]> {
    return api.get<ChangeRequest[]>('/change-requests/my-requests');
  }

  async getByRole(viewAll: boolean = false): Promise<ChangeRequest[]> {
    return api.get<ChangeRequest[]>(`/change-requests/by-role?viewAll=${viewAll}`);
  }

  async create(cr: Partial<ChangeRequest>): Promise<ChangeRequest> {
    return api.post<ChangeRequest>('/change-requests', cr);
  }

  async update(id: number, cr: Partial<ChangeRequest>): Promise<ChangeRequest> {
    return api.patch<ChangeRequest>(`/change-requests/${id}`, cr);
  }

  async delete(id: number): Promise<void> {
    return api.delete(`/change-requests/${id}`);
  }

  async canEditOrDelete(id: number): Promise<{ canEdit: boolean; canDelete: boolean }> {
    return api.get(`/change-requests/${id}/can-edit-or-delete`);
  }

  // Approval workflow
  async approve(id: number, data: { signatureFilePath?: string; comments?: string; assignedToITOfficerId?: number; riskAccepted?: boolean }): Promise<ChangeRequest> {
    return api.post<ChangeRequest>(`/change-requests/${id}/approve`, data);
  }

  async reject(id: number, data: { reason: string; signatureFilePath?: string; comments?: string }): Promise<ChangeRequest> {
    return api.post<ChangeRequest>(`/change-requests/${id}/reject`, data);
  }

  // IT Officer specific
  async updateITOFields(id: number, data: {
    category: string;
    subcategory: string;
    impactsClientService: boolean;
    impactAssessment: string;
    backoutRollbackPlan: string;
    expectedDowntimeValue: number;
    expectedDowntimeUnit: string;
    costInvolved?: number;
    plannedDatetime: string;
    lastBackupDate: string;
  }): Promise<ChangeRequest> {
    return api.patch<ChangeRequest>(`/change-requests/${id}/ito-fields`, data);
  }

  // Testing results
  async addTestingResults(id: number, data: {
    testType: string;
    testResults: Array<{
      testCase: string;
      expectedResult: string;
      actualResult: string;
      passed: boolean;
      remarks?: string;
    }>;
    passed: boolean;
    notes?: string;
  }): Promise<CRTestingResult> {
    return api.post<CRTestingResult>(`/change-requests/${id}/testing-results`, data);
  }

  async getTestingResults(id: number): Promise<CRTestingResult[]> {
    return api.get<CRTestingResult[]>(`/change-requests/${id}/testing-results`);
  }

  // QA Checklist
  async addQAChecklist(id: number, data: {
    checklistData: Array<{
      checkItem: string;
      checked: boolean;
      remarks?: string;
    }>;
    validated: boolean;
    notes?: string;
  }): Promise<CRQAChecklist> {
    return api.post<CRQAChecklist>(`/change-requests/${id}/qa-checklist`, data);
  }

  async getQAChecklists(id: number): Promise<CRQAChecklist[]> {
    return api.get<CRQAChecklist[]>(`/change-requests/${id}/qa-checklists`);
  }

  // Deployment team
  async addDeploymentTeamMember(id: number, data: {
    memberName: string;
    designation?: string;
    contact?: string;
    role?: string;
  }): Promise<CRDeploymentTeamMember> {
    return api.post<CRDeploymentTeamMember>(`/change-requests/${id}/deployment-team`, data);
  }

  async getDeploymentTeam(id: number): Promise<CRDeploymentTeamMember[]> {
    return api.get<CRDeploymentTeamMember[]>(`/change-requests/${id}/deployment-team`);
  }

  // File uploads
  async uploadSignature(id: number, signatureData: string): Promise<{ filePath: string }> {
    // Convert base64 to file and upload
    const formData = new FormData();
    const blob = this.base64ToBlob(signatureData, 'image/png');
    formData.append('file', blob, 'signature.png');
    return api.upload(`/change-requests/${id}/upload-signature`, formData);
  }

  async uploadDocument(id: number, formData: FormData): Promise<{ filePath: string }> {
    return api.upload(`/change-requests/${id}/upload-document`, formData);
  }

  // History and approvals
  async getHistory(id: number): Promise<CRHistory[]> {
    return api.get<CRHistory[]>(`/change-requests/${id}/history`);
  }

  async getApprovals(id: number): Promise<CRApproval[]> {
    return api.get<CRApproval[]>(`/change-requests/${id}/approvals`);
  }

  // NOC Closure
  async closeCR(id: number, data: {
    nocClosureNotes: string;
    incidentTriggered: boolean;
    incidentDetails?: string;
    rollbackTriggered: boolean;
    rollbackDetails?: string;
    nocClosureJustification?: string;
    signatureFilePath?: string;
  }): Promise<ChangeRequest> {
    return api.post<ChangeRequest>(`/change-requests/${id}/close`, data);
  }

  // Utility function to convert base64 to blob
  private base64ToBlob(base64: string, contentType: string): Blob {
    const base64Data = base64.split(',')[1] || base64;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  // Dashboard statistics
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    byStage: Record<number, number>;
    byPriority: Record<string, number>;
  }> {
    return api.get('/change-requests/statistics');
  }

  // Filter and search
  async search(params: {
    status?: string;
    priority?: string;
    stage?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<ChangeRequest[]> {
    const queryString = new URLSearchParams(params as any).toString();
    return api.get<ChangeRequest[]>(`/change-requests/search?${queryString}`);
  }
}

export default new ChangeRequestService();
