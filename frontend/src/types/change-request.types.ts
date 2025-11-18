export interface ChangeRequest {
  id: number;
  crNumber: string;
  requestedBy: number;
  requestDate: string;
  purposeOfChange: string;
  descriptionOfChange: string;
  lineManagerId: number;
  businessPriority: string;
  priorityJustification?: string;
  requestorSignature?: string;
  currentStage: number;
  currentStatus: string;
  assignedToITOfficerId?: number;

  // IT Officer fields (Stage 4)
  category?: string;
  subcategory?: string;
  impactsClientService?: boolean;
  impactAssessment?: string;
  backoutRollbackPlan?: string;
  uatDocumentPath?: string;
  expectedDowntimeValue?: number;
  expectedDowntimeUnit?: string;
  costInvolved?: number;
  plannedDatetime?: string;
  lastBackupDate?: string;
  itoSignature?: string;

  // NOC Closure fields (Stage 10)
  nocClosureNotes?: string;
  incidentTriggered?: boolean;
  incidentDetails?: string;
  rollbackTriggered?: boolean;
  rollbackDetails?: string;
  nocClosureJustification?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deploymentCompletedAt?: string;

  // Relations (populated from backend)
  requester?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  lineManager?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedITOfficer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  // Related collections (populated when fetching single CR with relations)
  approvals?: CRApproval[];
  testingResults?: CRTestingResult[];
  qaChecklists?: CRQAChecklist[];
  deploymentTeam?: CRDeploymentTeamMember[];
  attachments?: CRAttachment[];
  history?: CRHistory[];
}

export interface CRApproval {
  id: number;
  crId: number;
  stage: number;
  approverId: number;
  approverRole: string;
  status: string;
  signatureFilePath?: string;
  comments?: string;
  riskAccepted?: boolean;
  approvedAt?: string;
  createdAt: string;
  approver?: {
    firstName: string;
    lastName: string;
  };
}

export interface CRDeploymentTeamMember {
  id: number;
  crId: number;
  memberName: string;
  designation?: string;
  contact?: string;
  role: string;
  createdAt: string;
}

export interface CRTestingResult {
  id: number;
  crId: number;
  testType: string;
  testedBy: number;
  testDate: string;
  testResults: TestingResultItem[];
  passed?: boolean;
  notes?: string;
  createdAt: string;
  tester?: {
    firstName: string;
    lastName: string;
  };
}

export interface TestingResultItem {
  testCase: string;
  expectedResult: string;
  actualResult: string;
  passed: boolean;
  remarks?: string;
}

export interface CRQAChecklist {
  id: number;
  crId: number;
  qaOfficerId: number;
  checklistData: QAChecklistItem[];
  validated: boolean;
  validationDate?: string;
  notes?: string;
  createdAt: string;
  qaOfficer?: {
    firstName: string;
    lastName: string;
  };
}

export interface QAChecklistItem {
  checkItem: string;
  checked: boolean;
  remarks?: string;
}

export interface CRHistory {
  id: number;
  crId: number;
  changedBy: number;
  action: string;
  fromStage?: number;
  toStage?: number;
  fromStatus?: string;
  toStatus?: string;
  notes?: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface CRAttachment {
  id: number;
  crId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType: string;
  uploadedBy: number;
  uploadedAt: string;
  uploader?: {
    firstName: string;
    lastName: string;
  };
}

// Stage definitions matching your SOP
export const CR_STAGES = [
  { stage: 1, name: 'Request Submission', status: 'Draft', role: 'requestor', description: 'Requestor creates CR' },
  { stage: 2, name: 'Line Manager Approval', status: 'Pending LM Approval', role: 'line_manager', description: 'LM reviews and approves for UAT' },
  { stage: 3, name: 'Head of IT Approval', status: 'Pending HoIT Approval', role: 'head_of_it', description: 'HoIT approves and assigns to IT Officer' },
  { stage: 4, name: 'IT Officer Assessment', status: 'Assigned to IT Officer', role: 'it_officer', description: 'ITO fills impact assessment and testing' },
  { stage: 5, name: 'Requestor Test Confirmation', status: 'Requestor Test Confirmation Required', role: 'requestor', description: 'Requestor confirms testing results' },
  { stage: 6, name: 'QA Validation', status: 'Pending QA Validation', role: 'qa_officer', description: 'QA validates UAT results' },
  { stage: 7, name: 'Production Approval', status: 'Pending Production Approval', role: 'head_of_it', description: 'HoIT approves for production' },
  { stage: 8, name: 'InfoSec Approval', status: 'Pending Final Approval', role: 'head_of_infosec', description: 'HoIS gives final approval' },
  { stage: 9, name: 'Deployment', status: 'Ready to Deploy', role: 'it_officer', description: 'ITO deploys changes' },
  { stage: 10, name: 'NOC Closure', status: 'Waiting for Closure', role: 'noc', description: 'NOC closes CR after 48 hours' },
];

// Category and Subcategory mappings
export const CR_CATEGORIES: Record<string, string[]> = {
  'APPLICATION': ['POS APP', 'MERCHANT APP', 'SWITCH APP'],
  'SERVERS': ['AMEX', 'UPI', 'DOMAIN', 'MCARD', 'VISA', 'MDLWR'],
  'NETWORK DEVICES': ['DC-SWITCH', 'CORE-SW', 'EDGE-FW', 'DC-FW', 'INTERNET-FW'],
  'POS APPLICATION': ['SOFTWARE', 'PATCH'],
  'MERCHANT SUPPORT': ['DCC', 'PRE-AUTH', 'SETTLEMENT'],
};

export const CR_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const CR_DOWNTIME_UNITS = ['Minutes', 'Hours', 'Days'];

// Status colors for UI
export const CR_STATUS_COLORS: Record<string, string> = {
  'Draft': 'default',
  'Pending LM Approval': 'processing',
  'Pending HoIT Approval': 'processing',
  'Assigned to IT Officer': 'warning',
  'Requestor Test Confirmation Required': 'warning',
  'Pending QA Validation': 'processing',
  'Pending Production Approval': 'processing',
  'Pending Final Approval': 'processing',
  'Ready to Deploy': 'success',
  'Waiting for Closure': 'warning',
  'Completed': 'success',
  'Rejected': 'error',
};

export const CR_PRIORITY_COLORS: Record<string, string> = {
  'Low': 'green',
  'Medium': 'orange',
  'High': 'red',
  'Critical': 'magenta',
};

// Helper function to get stage name considering completion status
export const getStageName = (stage: number, status?: string): string => {
  if (status === 'Completed') {
    return 'Completed';
  }
  const stageInfo = CR_STAGES.find((s) => s.stage === stage);
  return stageInfo ? stageInfo.name : `Stage ${stage}`;
};

// Helper function to get stage description considering completion status
export const getStageDescription = (stage: number, status?: string): string => {
  if (status === 'Completed') {
    return 'Change request has been successfully completed and closed';
  }
  const stageInfo = CR_STAGES.find((s) => s.stage === stage);
  return stageInfo ? stageInfo.description : '';
};
