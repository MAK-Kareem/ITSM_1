import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { ChangeRequest } from './entities/change-request.entity';
import { CRApproval } from './entities/cr-approval.entity';
import { CRTestingResult } from './entities/cr-testing-result.entity';
import { CRQAChecklist } from './entities/cr-qa-checklist.entity';
import { CRDeploymentTeam } from './entities/cr-deployment-team.entity';
import { CRAttachment } from './entities/cr-attachment.entity';
import { CRHistory } from './entities/cr-history.entity';
import { EmailService } from '../../common/services/email.service';
import {
  CreateChangeRequestDto,
  ApproveChangeRequestDto,
  RejectChangeRequestDto,
  UpdateITOfficerFieldsDto,
  AddTestingResultsDto,
  AddQAChecklistDto,
  AddDeploymentTeamMemberDto,
  CloseChangeRequestDto,
  SearchChangeRequestDto,
} from './dto/change-request.dto';

@Injectable()
export class ChangeManagementService {
  constructor(
    @InjectRepository(ChangeRequest)
    private crRepository: Repository<ChangeRequest>,
    @InjectRepository(CRApproval)
    private approvalRepository: Repository<CRApproval>,
    @InjectRepository(CRTestingResult)
    private testingRepository: Repository<CRTestingResult>,
    @InjectRepository(CRQAChecklist)
    private qaChecklistRepository: Repository<CRQAChecklist>,
    @InjectRepository(CRDeploymentTeam)
    private deploymentTeamRepository: Repository<CRDeploymentTeam>,
    @InjectRepository(CRAttachment)
    private attachmentRepository: Repository<CRAttachment>,
    @InjectRepository(CRHistory)
    private historyRepository: Repository<CRHistory>,
    private emailService: EmailService,
  ) {}

  // ========================
  // STAGE 1: CREATE CR
  // ========================
  async create(createDto: CreateChangeRequestDto, userId: number): Promise<ChangeRequest> {
    // Validate high priority justification
    if (createDto.businessPriority === 'High' && !createDto.priorityJustification) {
      throw new BadRequestException('Priority justification is required for High priority');
    }

    const crNumber = await this.generateCRNumber();

    const cr = this.crRepository.create({
      crNumber,
      requestedBy: userId,
      purposeOfChange: createDto.purposeOfChange,
      descriptionOfChange: createDto.descriptionOfChange,
      lineManagerId: createDto.lineManagerId,
      businessPriority: createDto.businessPriority,
      priorityJustification: createDto.priorityJustification,
      requestorSignature: createDto.requestorSignature,
      currentStage: 2, // Move directly to LM approval stage
      currentStatus: 'Pending LM Approval',
    });

    const savedCr = await this.crRepository.save(cr);

    // Create history entry
    await this.createHistoryEntry(
      savedCr.id,
      userId,
      'created',
      1,
      2,
      'Draft',
      'Pending LM Approval',
      'CR created and submitted for Line Manager approval',
    );

    // Send notification to Line Manager
    await this.sendNotification(savedCr, 'CR_CREATED', [savedCr.lineManagerId]);

    return this.findOne(savedCr.id);
  }

  // ========================
  // READ OPERATIONS
  // ========================
  async findAll(): Promise<ChangeRequest[]> {
    return this.crRepository.find({
      relations: ['requester', 'lineManager', 'assignedITOfficer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ChangeRequest> {
    const cr = await this.crRepository.findOne({
      where: { id },
      relations: [
        'requester',
        'lineManager',
        'assignedITOfficer',
        'approvals',
        'approvals.approver',
        'testingResults',
        'testingResults.tester',
        'qaChecklists',
        'qaChecklists.qaOfficer',
        'deploymentTeam',
        'attachments',
        'attachments.uploader',
        'history',
        'history.user',
      ],
    });

    if (!cr) {
      throw new NotFoundException(`Change Request with ID ${id} not found`);
    }

    return cr;
  }

  async findByUser(userId: number): Promise<ChangeRequest[]> {
    return this.crRepository.find({
      where: { requestedBy: userId },
      relations: ['requester', 'lineManager', 'assignedITOfficer'],
      order: { createdAt: 'DESC' },
    });
  }

  async search(searchDto: SearchChangeRequestDto): Promise<ChangeRequest[]> {
    const query = this.crRepository.createQueryBuilder('cr')
      .leftJoinAndSelect('cr.requester', 'requester')
      .leftJoinAndSelect('cr.lineManager', 'lineManager')
      .leftJoinAndSelect('cr.assignedITOfficer', 'assignedITOfficer');

    if (searchDto.status) {
      query.andWhere('cr.currentStatus = :status', { status: searchDto.status });
    }

    if (searchDto.priority) {
      query.andWhere('cr.businessPriority = :priority', { priority: searchDto.priority });
    }

    if (searchDto.stage) {
      query.andWhere('cr.currentStage = :stage', { stage: searchDto.stage });
    }

    if (searchDto.dateFrom && searchDto.dateTo) {
      query.andWhere('cr.requestDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: searchDto.dateFrom,
        dateTo: searchDto.dateTo,
      });
    }

    if (searchDto.search) {
      query.andWhere(
        '(cr.crNumber ILIKE :search OR cr.purposeOfChange ILIKE :search OR cr.descriptionOfChange ILIKE :search)',
        { search: `%${searchDto.search}%` },
      );
    }

    query.orderBy('cr.createdAt', 'DESC');

    return query.getMany();
  }

  // ========================
  // APPROVAL WORKFLOW
  // ========================
  async approve(
    id: number,
    approvalDto: ApproveChangeRequestDto,
    userId: number,
    userRole: string,
  ): Promise<ChangeRequest> {
    const cr = await this.findOne(id);

    // Validate stage and role
    this.validateApproverRole(cr.currentStage, userRole, cr.requestedBy, userId);

    // Stage-specific validations
    if (cr.currentStage === 3 && !approvalDto.assignedToITOfficerId) {
      throw new BadRequestException('IT Officer must be assigned at this stage');
    }

    if (cr.currentStage === 7 && approvalDto.riskAccepted !== true) {
      throw new BadRequestException('Risk must be accepted for production approval');
    }

    // Create approval record
    const approval = this.approvalRepository.create({
      crId: id,
      stage: cr.currentStage,
      approverId: userId,
      approverRole: userRole,
      status: 'approved',
      signatureFilePath: approvalDto.signatureFilePath,
      comments: approvalDto.comments,
      riskAccepted: approvalDto.riskAccepted,
      approvedAt: new Date(),
    });

    await this.approvalRepository.save(approval);

    // Update CR with stage-specific data
    if (cr.currentStage === 3 && approvalDto.assignedToITOfficerId) {
      cr.assignedToITOfficerId = approvalDto.assignedToITOfficerId;
    }

    // Update CR to next stage
    const { nextStage, nextStatus } = this.getNextStageAndStatus(cr.currentStage);

    const oldStage = cr.currentStage;
    const oldStatus = cr.currentStatus;

    cr.currentStage = nextStage;
    cr.currentStatus = nextStatus;

    // Handle deployment completion (Stage 9)
    if (oldStage === 9) {
      cr.deploymentCompletedAt = new Date();
    }

    const updatedCr = await this.crRepository.save(cr);

    // Create history entry
    await this.createHistoryEntry(
      id,
      userId,
      'approved',
      oldStage,
      nextStage,
      oldStatus,
      nextStatus,
      approvalDto.comments || 'Approved',
    );

    // Send notifications based on stage
    await this.sendStageNotifications(updatedCr, oldStage, nextStage);

    return this.findOne(id);
  }

  async reject(
    id: number,
    rejectionDto: RejectChangeRequestDto,
    userId: number,
    userRole: string,
  ): Promise<ChangeRequest> {
    const cr = await this.findOne(id);

    this.validateApproverRole(cr.currentStage, userRole, cr.requestedBy, userId);

    const approval = this.approvalRepository.create({
      crId: id,
      stage: cr.currentStage,
      approverId: userId,
      approverRole: userRole,
      status: 'rejected',
      signatureFilePath: rejectionDto.signatureFilePath,
      comments: rejectionDto.reason,
      approvedAt: new Date(),
    });

    await this.approvalRepository.save(approval);

    const oldStatus = cr.currentStatus;
    cr.currentStatus = 'Rejected';

    const updatedCr = await this.crRepository.save(cr);

    await this.createHistoryEntry(
      id,
      userId,
      'rejected',
      cr.currentStage,
      cr.currentStage,
      oldStatus,
      'Rejected',
      rejectionDto.reason,
    );

    // Notify requestor and relevant stakeholders
    await this.sendNotification(updatedCr, 'CR_REJECTED', [cr.requestedBy]);

    return this.findOne(id);
  }

  // ========================
  // STAGE 4: IT OFFICER ASSESSMENT
  // ========================
  async updateITOfficerFields(
    id: number,
    updateDto: UpdateITOfficerFieldsDto,
    userId: number,
  ): Promise<ChangeRequest> {
    const cr = await this.findOne(id);

    if (cr.currentStage !== 4) {
      throw new BadRequestException('CR is not at IT Officer assessment stage');
    }

    if (cr.assignedToITOfficerId !== userId) {
      throw new ForbiddenException('Only the assigned IT Officer can update these fields');
    }

    // Validate category/subcategory combinations
    this.validateCategorySubcategory(updateDto.category, updateDto.subcategory);

    Object.assign(cr, {
      category: updateDto.category,
      subcategory: updateDto.subcategory,
      impactsClientService: updateDto.impactsClientService,
      impactAssessment: updateDto.impactAssessment,
      backoutRollbackPlan: updateDto.backoutRollbackPlan,
      expectedDowntimeValue: updateDto.expectedDowntimeValue,
      expectedDowntimeUnit: updateDto.expectedDowntimeUnit,
      costInvolved: updateDto.costInvolved || 0,
      plannedDatetime: new Date(updateDto.plannedDatetime),
      lastBackupDate: new Date(updateDto.lastBackupDate),
    });

    const updatedCr = await this.crRepository.save(cr);

    await this.createHistoryEntry(
      id,
      userId,
      'updated',
      cr.currentStage,
      cr.currentStage,
      cr.currentStatus,
      cr.currentStatus,
      'IT Officer assessment fields updated',
    );

    return this.findOne(id);
  }

  // ========================
  // TESTING RESULTS
  // ========================
  async addTestingResults(
    id: number,
    testingDto: AddTestingResultsDto,
    userId: number,
  ): Promise<CRTestingResult> {
    const cr = await this.findOne(id);

    const testing = this.testingRepository.create({
      crId: id,
      testType: testingDto.testType,
      testedBy: userId,
      testResults: testingDto.testResults,
      passed: testingDto.passed,
      notes: testingDto.notes,
    });

    const savedTesting = await this.testingRepository.save(testing);

    await this.createHistoryEntry(
      id,
      userId,
      'testing_added',
      cr.currentStage,
      cr.currentStage,
      cr.currentStatus,
      cr.currentStatus,
      `${testingDto.testType} results added - ${testingDto.passed ? 'PASSED' : 'FAILED'}`,
    );

    return savedTesting;
  }

  async getTestingResults(id: number): Promise<CRTestingResult[]> {
    return this.testingRepository.find({
      where: { crId: id },
      relations: ['tester'],
      order: { createdAt: 'DESC' },
    });
  }

  // ========================
  // QA CHECKLIST
  // ========================
  async addQAChecklist(
    id: number,
    checklistDto: AddQAChecklistDto,
    userId: number,
  ): Promise<CRQAChecklist> {
    const cr = await this.findOne(id);

    if (cr.currentStage !== 6) {
      throw new BadRequestException('CR is not at QA validation stage');
    }

    const checklist = this.qaChecklistRepository.create({
      crId: id,
      qaOfficerId: userId,
      checklistData: checklistDto.checklistData,
      validated: checklistDto.validated,
      validationDate: checklistDto.validated ? new Date() : null,
      notes: checklistDto.notes,
    });

    const savedChecklist = await this.qaChecklistRepository.save(checklist);

    await this.createHistoryEntry(
      id,
      userId,
      'qa_checklist_added',
      cr.currentStage,
      cr.currentStage,
      cr.currentStatus,
      cr.currentStatus,
      `QA checklist ${checklistDto.validated ? 'validated' : 'added'}`,
    );

    return savedChecklist;
  }

  async getQAChecklists(id: number): Promise<CRQAChecklist[]> {
    return this.qaChecklistRepository.find({
      where: { crId: id },
      relations: ['qaOfficer'],
      order: { createdAt: 'DESC' },
    });
  }

  // ========================
  // DEPLOYMENT TEAM
  // ========================
  async addDeploymentTeamMember(
    id: number,
    memberDto: AddDeploymentTeamMemberDto,
  ): Promise<CRDeploymentTeam> {
    const cr = await this.findOne(id);

    const member = this.deploymentTeamRepository.create({
      crId: id,
      memberName: memberDto.memberName,
      designation: memberDto.designation,
      contact: memberDto.contact,
      role: memberDto.role || 'member',
    });

    return this.deploymentTeamRepository.save(member);
  }

  async getDeploymentTeam(id: number): Promise<CRDeploymentTeam[]> {
    return this.deploymentTeamRepository.find({
      where: { crId: id },
      order: { createdAt: 'ASC' },
    });
  }

  // ========================
  // ATTACHMENTS
  // ========================
  async addAttachment(
    id: number,
    attachmentData: {
      fileName: string;
      filePath: string;
      fileSize: number;
      fileType: string;
    },
    userId: number,
  ): Promise<CRAttachment> {
    const attachment = this.attachmentRepository.create({
      crId: id,
      fileName: attachmentData.fileName,
      filePath: attachmentData.filePath,
      fileSize: attachmentData.fileSize,
      fileType: attachmentData.fileType,
      uploadedBy: userId,
    });

    return this.attachmentRepository.save(attachment);
  }

  // ========================
  // HISTORY & APPROVALS
  // ========================
  async getCRHistory(id: number): Promise<CRHistory[]> {
    return this.historyRepository.find({
      where: { crId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCRApprovals(id: number): Promise<CRApproval[]> {
    return this.approvalRepository.find({
      where: { crId: id },
      relations: ['approver'],
      order: { stage: 'ASC' },
    });
  }

  // ========================
  // STAGE 10: NOC CLOSURE
  // ========================
  async closeCR(
    id: number,
    closureDto: CloseChangeRequestDto,
    userId: number,
  ): Promise<ChangeRequest> {
    const cr = await this.findOne(id);

    if (cr.currentStage !== 10) {
      throw new BadRequestException('CR is not at NOC closure stage');
    }

    // Check 48-hour rule
    const deploymentTime = cr.deploymentCompletedAt || cr.updatedAt;
    const hoursSinceDeployment = this.calculateHoursDifference(deploymentTime, new Date());

    if (hoursSinceDeployment < 48 && !closureDto.nocClosureJustification) {
      throw new BadRequestException(
        'Early closure (< 48 hours) requires justification',
      );
    }

    // Validate incident details
    if (closureDto.incidentTriggered && !closureDto.incidentDetails) {
      throw new BadRequestException('Incident details required when incident is triggered');
    }

    // Validate rollback details
    if (closureDto.rollbackTriggered && !closureDto.rollbackDetails) {
      throw new BadRequestException('Rollback details required when rollback is triggered');
    }

    cr.nocClosureNotes = closureDto.nocClosureNotes;
    cr.incidentTriggered = closureDto.incidentTriggered;
    cr.incidentDetails = closureDto.incidentDetails;
    cr.rollbackTriggered = closureDto.rollbackTriggered;
    cr.rollbackDetails = closureDto.rollbackDetails;
    cr.nocClosureJustification = closureDto.nocClosureJustification;
    cr.nocSignature = closureDto.signatureFilePath;
    cr.currentStage = 10; // Keep at stage 10 (was 11, but database constraint limits to 10)
    cr.currentStatus = 'Completed';
    cr.completedAt = new Date();

    const updatedCr = await this.crRepository.save(cr);

    // Create approval record for NOC closure
    const approval = this.approvalRepository.create({
      crId: id,
      stage: 10,
      approverId: userId,
      approverRole: 'noc',
      status: 'approved',
      signatureFilePath: closureDto.signatureFilePath,
      comments: closureDto.nocClosureNotes,
      approvedAt: new Date(),
    });

    await this.approvalRepository.save(approval);

    await this.createHistoryEntry(
      id,
      userId,
      'closed',
      10,
      10, // Stay at stage 10 (was 11)
      'Waiting for Closure',
      'Completed',
      closureDto.nocClosureNotes,
    );

    // Notify all stakeholders
    await this.sendNotification(updatedCr, 'CR_CLOSED', [
      cr.requestedBy,
      cr.lineManagerId,
      cr.assignedToITOfficerId,
    ]);

    return this.findOne(id);
  }

  // ========================
  // STATISTICS
  // ========================
  async getStatistics(): Promise<any> {
    const total = await this.crRepository.count();
    const pending = await this.crRepository.count({
      where: [
        { currentStatus: 'Pending LM Approval' },
        { currentStatus: 'Pending HoIT Approval' },
        { currentStatus: 'IT Officer Assessment' },
        { currentStatus: 'Requestor Test Confirmation Required' },
        { currentStatus: 'Pending QA Validation' },
        { currentStatus: 'Pending Production Approval' },
        { currentStatus: 'Pending Final Approval' },
        { currentStatus: 'Ready to Deploy' },
        { currentStatus: 'Waiting for Closure' },
      ],
    });
    const completed = await this.crRepository.count({
      where: { currentStatus: 'Completed' },
    });
    const rejected = await this.crRepository.count({
      where: { currentStatus: 'Rejected' },
    });

    // Count by stage
    const byStage: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) { // Changed from 11 to 10
      byStage[i] = await this.crRepository.count({ where: { currentStage: i } });
    }

    // Count by priority
    const byPriority = {
      Low: await this.crRepository.count({ where: { businessPriority: 'Low' } }),
      Medium: await this.crRepository.count({ where: { businessPriority: 'Medium' } }),
      High: await this.crRepository.count({ where: { businessPriority: 'High' } }),
      Critical: await this.crRepository.count({ where: { businessPriority: 'Critical' } }),
    };

    return {
      total,
      pending,
      completed,
      rejected,
      byStage,
      byPriority,
    };
  }

  // ========================
  // PRIVATE HELPER METHODS
  // ========================
  private async generateCRNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.crRepository.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `CR-${year}-${sequence}`;
  }

  private validateApproverRole(
    stage: number,
    role: string,
    requestorId: number,
    userId: number,
  ): void {
    const stageRoleMap: Record<number, string[]> = {
      2: ['line_manager'],
      3: ['head_of_it'],
      4: ['it_officer'],
      5: ['requestor'], // Special case - check userId
      6: ['qa_officer'],
      7: ['head_of_it'],
      8: ['head_of_infosec'],
      9: ['it_officer'],
      10: ['noc'],
    };

    const allowedRoles = stageRoleMap[stage];

    if (!allowedRoles) {
      throw new BadRequestException(`Invalid stage ${stage} for approval`);
    }

    // Special case for requestor confirmation
    if (stage === 5) {
      if (requestorId !== userId) {
        throw new ForbiddenException('Only the original requestor can confirm test results');
      }
      return;
    }

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(
        `Only ${allowedRoles.join(' or ')} can approve at stage ${stage}`,
      );
    }
  }

  private getNextStageAndStatus(
    currentStage: number,
  ): { nextStage: number; nextStatus: string } {
    const stageFlow: Record<number, { nextStage: number; nextStatus: string }> = {
      2: { nextStage: 3, nextStatus: 'Pending HoIT Approval' },
      3: { nextStage: 4, nextStatus: 'Assigned to IT Officer' },
      4: { nextStage: 5, nextStatus: 'Requestor Test Confirmation Required' },
      5: { nextStage: 6, nextStatus: 'Pending QA Validation' },
      6: { nextStage: 7, nextStatus: 'Pending Production Approval' },
      7: { nextStage: 8, nextStatus: 'Pending Final Approval' },
      8: { nextStage: 9, nextStatus: 'Ready to Deploy' },
      9: { nextStage: 10, nextStatus: 'Waiting for Closure' },
      10: { nextStage: 10, nextStatus: 'Completed' }, // Stay at 10 (was 11)
    };

    return stageFlow[currentStage] || { nextStage: currentStage, nextStatus: 'Unknown' };
  }

  private validateCategorySubcategory(category: string, subcategory: string): void {
    const validCombinations: Record<string, string[]> = {
      APPLICATION: ['POS APP', 'MERCHANT APP', 'SWITCH APP'],
      SERVERS: ['AMEX', 'UPI', 'DOMAIN', 'MCARD', 'VISA', 'MDLWR'],
      'NETWORK DEVICES': ['DC-SWITCH', 'CORE-SW', 'EDGE-FW', 'DC-FW', 'INTERNET-FW'],
      'POS APPLICATION': ['SOFTWARE', 'PATCH'],
      'MERCHANT SUPPORT': ['DCC', 'PRE-AUTH', 'SETTLEMENT'],
    };

    const validSubcategories = validCombinations[category];
    if (!validSubcategories) {
      throw new BadRequestException(`Invalid category: ${category}`);
    }

    if (!validSubcategories.includes(subcategory)) {
      throw new BadRequestException(
        `Invalid subcategory '${subcategory}' for category '${category}'`,
      );
    }
  }

  private calculateHoursDifference(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  private async createHistoryEntry(
    crId: number,
    userId: number,
    action: string,
    fromStage: number,
    toStage: number,
    fromStatus: string,
    toStatus: string,
    notes: string,
  ): Promise<void> {
    const history = this.historyRepository.create({
      crId,
      changedBy: userId,
      action,
      fromStage,
      toStage,
      fromStatus,
      toStatus,
      notes,
    });

    await this.historyRepository.save(history);
  }

  private async sendNotification(
    cr: ChangeRequest,
    notificationType: string,
    recipientIds: number[],
  ): Promise<void> {
    try {
      await this.emailService.sendCRNotification(cr, notificationType, recipientIds);
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw - notification failure shouldn't block workflow
    }
  }

  private async sendStageNotifications(
    cr: ChangeRequest,
    oldStage: number,
    newStage: number,
  ): Promise<void> {
    const notificationMap: Record<number, { type: string; recipients: number[] }> = {
      3: { type: 'LM_APPROVED', recipients: [] }, // Head of IT - need to look up
      4: { type: 'HOIT_APPROVED', recipients: [cr.assignedToITOfficerId] },
      5: { type: 'ITO_SUBMITTED', recipients: [cr.requestedBy] },
      6: { type: 'REQUESTOR_CONFIRMED', recipients: [] }, // QA Officer - need to look up
      7: { type: 'QA_VALIDATED', recipients: [] }, // Head of IT
      8: { type: 'HOIT_PRODUCTION_APPROVED', recipients: [] }, // Head of InfoSec
      9: { type: 'HOIS_APPROVED', recipients: [cr.assignedToITOfficerId] },
      10: { type: 'DEPLOYMENT_COMPLETED', recipients: [] }, // NOC and all stakeholders
    };

    const notification = notificationMap[newStage];
    if (notification && notification.recipients.length > 0) {
      await this.sendNotification(cr, notification.type, notification.recipients);
    }
  }
}
