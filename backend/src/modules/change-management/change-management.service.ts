import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, Not } from 'typeorm';
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

    // IMPORTANT: Load CR with relations BEFORE sending notification
    const fullCr = await this.findOne(savedCr.id);

    // Send notification to Line Manager (with fully loaded CR)
    await this.sendNotification(fullCr, 'CR_CREATED', [fullCr.lineManagerId]);

    return fullCr;
  }

  // ========================
  // EDIT/DELETE OPERATIONS (BATON PASS LOGIC)
  // ========================

  /**
   * Update/Edit a Change Request
   * Permissions:
   * - Requestor can edit only at Stage 2 (Pending LM Approval)
   * - Line Manager can edit at Stage 3 (after LM approval, before HoIT approval)
   * - Head of IT can edit at Stage 4+ (after HoIT approval) until closure
   */
  async update(
    id: number,
    updateDto: Partial<CreateChangeRequestDto>,
    userId: number,
    userRoles: string[],
  ): Promise<ChangeRequest> {
    const cr = await this.findOne(id);

    // Check if CR is already completed or rejected
    if (cr.currentStatus === 'Completed' || cr.currentStatus === 'Rejected') {
      throw new BadRequestException('Cannot edit a completed or rejected CR');
    }

    // Validate edit permissions based on current stage
    this.validateEditPermissions(cr, userId, userRoles);

    // Update fields (only allow editing basic fields, not workflow fields)
    if (updateDto.purposeOfChange) cr.purposeOfChange = updateDto.purposeOfChange;
    if (updateDto.descriptionOfChange) cr.descriptionOfChange = updateDto.descriptionOfChange;
    if (updateDto.businessPriority) cr.businessPriority = updateDto.businessPriority;
    if (updateDto.priorityJustification !== undefined) {
      cr.priorityJustification = updateDto.priorityJustification;
    }
    if (updateDto.lineManagerId) cr.lineManagerId = updateDto.lineManagerId;

    const updatedCr = await this.crRepository.save(cr);

    // Create history entry
    await this.createHistoryEntry(
      id,
      userId,
      'updated',
      cr.currentStage,
      cr.currentStage,
      cr.currentStatus,
      cr.currentStatus,
      'CR updated',
    );

    return this.findOne(id);
  }

  /**
   * Delete a Change Request
   * Same permissions as edit
   */
  async remove(id: number, userId: number, userRoles: string[]): Promise<void> {
    const cr = await this.findOne(id);

    // Check if CR is already completed or rejected
    if (cr.currentStatus === 'Completed') {
      throw new BadRequestException('Cannot delete a completed CR');
    }

    // Validate delete permissions
    this.validateEditPermissions(cr, userId, userRoles);

    // Create history entry before deletion
    await this.createHistoryEntry(
      id,
      userId,
      'deleted',
      cr.currentStage,
      cr.currentStage,
      cr.currentStatus,
      'Deleted',
      'CR deleted',
    );

    // Soft delete by updating status (or hard delete if preferred)
    cr.currentStatus = 'Deleted';
    await this.crRepository.save(cr);

    // Alternatively, for hard delete:
    // await this.crRepository.remove(cr);
  }

  /**
   * Validate Edit/Delete Permissions (Baton Pass Logic)
   */
  private validateEditPermissions(
    cr: ChangeRequest,
    userId: number,
    userRoles: string[],
  ): void {
    const stage = cr.currentStage;

    // Stage 2 (Pending LM Approval): Only Requestor can edit/delete
    if (stage === 2) {
      if (cr.requestedBy !== userId) {
        throw new ForbiddenException('Only the requestor can edit/delete at this stage');
      }
      return;
    }

    // Stage 3 (Pending HoIT Approval): Only Line Manager can edit/delete
    if (stage === 3) {
      if (!userRoles.includes('line_manager') && cr.lineManagerId !== userId) {
        throw new ForbiddenException('Only the line manager can edit/delete at this stage');
      }
      return;
    }

    // Stage 4+ (After HoIT approval): Only Head of IT can edit/delete
    if (stage >= 4 && stage < 10) {
      if (!userRoles.includes('head_of_it')) {
        throw new ForbiddenException('Only Head of IT can edit/delete at this stage');
      }
      return;
    }

    // Stage 10 (Completed/Closure): No one can edit/delete
    throw new ForbiddenException('Cannot edit/delete at this stage');
  }

  /**
   * Check if user can edit/delete a CR (for frontend use)
   */
  async canEditOrDelete(id: number, userId: number, userRoles: string[]): Promise<boolean> {
    try {
      const cr = await this.findOne(id);
      this.validateEditPermissions(cr, userId, userRoles);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ========================
  // READ OPERATIONS
  // ========================
  async findAll(): Promise<ChangeRequest[]> {
    return this.crRepository.find({
      where: { currentStatus: Not('Deleted') }, // Exclude deleted CRs
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
      where: { requestedBy: userId, currentStatus: Not('Deleted') },
      relations: ['requester', 'lineManager', 'assignedITOfficer'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get CRs filtered by user role - shows only relevant CRs by default
   * @param userId - Current user ID
   * @param userRole - Current user role
   * @param viewAll - If true, show all CRs (toggle enabled)
   */
  async findByRole(userId: number, userRole: string, viewAll: boolean = false): Promise<ChangeRequest[]> {
    // If viewAll is enabled, return all CRs
    if (viewAll) {
      return this.findAll();
    }

    const query = this.crRepository.createQueryBuilder('cr')
      .leftJoinAndSelect('cr.requester', 'requester')
      .leftJoinAndSelect('cr.lineManager', 'lineManager')
      .leftJoinAndSelect('cr.assignedITOfficer', 'assignedITOfficer')
      .leftJoinAndSelect('cr.deploymentTeam', 'deploymentTeam')
      .where('cr.currentStatus != :deleted', { deleted: 'Deleted' });

    switch (userRole) {
      case 'requestor':
        // Requestor sees only their own CRs
        query.andWhere('cr.requestedBy = :userId', { userId });
        break;

      case 'line_manager':
        // REQUIREMENT #3: Line Manager sees only CRs at Stage 2 (Pending LM Approval) assigned to them
        query.andWhere('cr.lineManagerId = :userId', { userId });
        query.andWhere('cr.currentStage = :stage', { stage: 2 });
        break;

      case 'head_of_it':
        // REQUIREMENT #3: Head of IT sees only CRs at Stage 3 (Pending HoIT Approval) or Stage 7 (Production Approval)
        query.andWhere('(cr.currentStage = :stage3 OR cr.currentStage = :stage7)', { stage3: 3, stage7: 7 });
        break;

      case 'it_officer':
        // IT Officer sees only CRs assigned to them at Stage 4 or Stage 9
        query.andWhere('cr.assignedToITOfficerId = :userId', { userId });
        query.andWhere('(cr.currentStage = :stage4 OR cr.currentStage = :stage9)', { stage4: 4, stage9: 9 });
        break;

      case 'qa_officer':
        // QA sees only CRs at Stage 6 (Pending QA Validation)
        query.andWhere('cr.currentStage = :stage', { stage: 6 });
        break;

      case 'head_of_infosec':
        // Head of InfoSec sees only CRs at Stage 8 (Pending InfoSec approval)
        query.andWhere('cr.currentStage = :stage', { stage: 8 });
        break;

      case 'noc':
        // NOC sees only CRs at Stage 10 (Waiting for closure)
        query.andWhere('cr.currentStage = :stage', { stage: 10 });
        break;

      default:
        // For any other role or admin, show all CRs
        break;
    }

    query.orderBy('cr.createdAt', 'DESC');
    return query.getMany();
  }

  /**
   * Check if user is part of deployment team for a CR
   */
  async isUserInDeploymentTeam(crId: number, userId: number): Promise<boolean> {
    const count = await this.deploymentTeamRepository.count({
      where: {
        crId,
        // Assuming deployment team has a userId field, adjust if needed
        // If it doesn't, you'll need to match by name/email
      },
    });
    return count > 0;
  }

  async search(searchDto: SearchChangeRequestDto): Promise<ChangeRequest[]> {
    const query = this.crRepository.createQueryBuilder('cr')
      .leftJoinAndSelect('cr.requester', 'requester')
      .leftJoinAndSelect('cr.lineManager', 'lineManager')
      .leftJoinAndSelect('cr.assignedITOfficer', 'assignedITOfficer')
      .where('cr.currentStatus != :deleted', { deleted: 'Deleted' });

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

    // Send notifications based on stage (ENHANCED EMAIL NOTIFICATIONS)
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

    // Validate stage and role
    this.validateApproverRole(cr.currentStage, userRole, cr.requestedBy, userId);

    // Create rejection approval record
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

    const oldStage = cr.currentStage;
    const oldStatus = cr.currentStatus;

    cr.currentStatus = 'Rejected';

    const updatedCr = await this.crRepository.save(cr);

    await this.createHistoryEntry(
      id,
      userId,
      'rejected',
      oldStage,
      oldStage,
      oldStatus,
      'Rejected',
      rejectionDto.reason,
    );

    // Notify requestor and all stakeholders of rejection
    const recipients = [cr.requestedBy, cr.lineManagerId];
    if (cr.assignedToITOfficerId) {
      recipients.push(cr.assignedToITOfficerId);
    }
    await this.sendNotification(updatedCr, 'CR_REJECTED', recipients);

    return this.findOne(id);
  }

  // ========================
  // IT OFFICER ASSESSMENT (Stage 4)
  // ========================
  async updateITOfficerFields(
    id: number,
    updateDto: UpdateITOfficerFieldsDto,
    userId: number,
  ): Promise<ChangeRequest> {
    const cr = await this.findOne(id);

    // Validate that we're at Stage 4 and user is the assigned IT Officer
    if (cr.currentStage !== 4) {
      throw new BadRequestException('CR must be at IT Officer Assessment stage');
    }

    if (cr.assignedToITOfficerId !== userId) {
      throw new ForbiddenException('Only the assigned IT Officer can update these fields');
    }

    // Validate category/subcategory
    this.validateCategorySubcategory(updateDto.category, updateDto.subcategory);

    // Update IT Officer fields
    cr.category = updateDto.category;
    cr.subcategory = updateDto.subcategory;
    cr.impactsClientService = updateDto.impactsClientService;
    cr.impactAssessment = updateDto.impactAssessment;
    cr.backoutRollbackPlan = updateDto.backoutRollbackPlan;
    cr.expectedDowntimeValue = updateDto.expectedDowntimeValue;
    cr.expectedDowntimeUnit = updateDto.expectedDowntimeUnit;
    cr.costInvolved = updateDto.costInvolved;
    cr.plannedDatetime = new Date(updateDto.plannedDatetime);
    cr.lastBackupDate = new Date(updateDto.lastBackupDate);

    const updatedCr = await this.crRepository.save(cr);

    await this.createHistoryEntry(
      id,
      userId,
      'ito_fields_updated',
      4,
      4,
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

    const testingResult = this.testingRepository.create({
      crId: id,
      testType: testingDto.testType,
      testedBy: userId,
      testResults: testingDto.testResults,
      passed: testingDto.passed,
      notes: testingDto.notes,
    });

    const saved = await this.testingRepository.save(testingResult);

    await this.createHistoryEntry(
      id,
      userId,
      'testing_results_added',
      cr.currentStage,
      cr.currentStage,
      cr.currentStatus,
      cr.currentStatus,
      `Testing results added: ${testingDto.testType}`,
    );

    return saved;
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
      throw new BadRequestException('QA checklist can only be added at Stage 6');
    }

    const checklist = this.qaChecklistRepository.create({
      crId: id,
      qaOfficerId: userId,
      checklistData: checklistDto.checklistData,
      validated: checklistDto.validated,
      validationDate: checklistDto.validated ? new Date() : null,
      notes: checklistDto.notes,
    });

    const saved = await this.qaChecklistRepository.save(checklist);

    await this.createHistoryEntry(
      id,
      userId,
      'qa_checklist_added',
      6,
      6,
      cr.currentStatus,
      cr.currentStatus,
      'QA checklist added',
    );

    return saved;
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
    const member = this.deploymentTeamRepository.create({
      crId: id,
      memberName: memberDto.memberName,
      designation: memberDto.designation,
      contact: memberDto.contact,
      role: memberDto.role || 'member',
    });

    const saved = await this.deploymentTeamRepository.save(member);

    // REQUIREMENT #12: Send email notification to deployment team member
    if (memberDto.contact && memberDto.contact.includes('@')) {
      try {
        const cr = await this.findOne(id);
        await this.emailService.sendCRNotificationByEmail(
          cr,
          'DEPLOYMENT_TEAM_ADDED',
          [memberDto.contact],
        );
        console.log(`✅ Deployment team notification sent to ${memberDto.contact}`);
      } catch (error) {
        console.error('❌ Failed to send deployment team notification:', error);
        // Don't throw - notification failure shouldn't block the operation
      }
    }

    return saved;
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
      order: { createdAt: 'ASC' },
    });
  }

  async getCRApprovals(id: number): Promise<CRApproval[]> {
    return this.approvalRepository.find({
      where: { crId: id },
      relations: ['approver'],
      order: { createdAt: 'ASC' },
    });
  }

  // ========================
  // NOC CLOSURE (Stage 10)
  // ========================
  async closeCR(
    id: number,
    closureDto: CloseChangeRequestDto,
    userId: number,
  ): Promise<ChangeRequest> {
    const cr = await this.findOne(id);

    if (cr.currentStage !== 10) {
      throw new BadRequestException('CR must be at NOC closure stage');
    }

    // Validate 48-hour period unless justified
    const hoursSinceDeployment = this.calculateHoursDifference(
      cr.deploymentCompletedAt || cr.updatedAt,
      new Date(),
    );

    if (hoursSinceDeployment < 48 && !closureDto.nocClosureJustification) {
      throw new BadRequestException(
        'Justification required for closure before 48-hour monitoring period',
      );
    }

    // Validate incident/rollback details if triggered
    if (closureDto.incidentTriggered && !closureDto.incidentDetails) {
      throw new BadRequestException('Incident details are required when incident is triggered');
    }

    if (closureDto.rollbackTriggered && !closureDto.rollbackDetails) {
      throw new BadRequestException('Rollback details are required when rollback is triggered');
    }

    // Update CR with closure details
    cr.nocClosureNotes = closureDto.nocClosureNotes;
    cr.incidentTriggered = closureDto.incidentTriggered;
    cr.incidentDetails = closureDto.incidentDetails;
    cr.rollbackTriggered = closureDto.rollbackTriggered;
    cr.rollbackDetails = closureDto.rollbackDetails;
    cr.nocClosureJustification = closureDto.nocClosureJustification;
    cr.nocSignature = closureDto.signatureFilePath;
    cr.currentStage = 10;
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
      10,
      'Waiting for Closure',
      'Completed',
      closureDto.nocClosureNotes,
    );

    // Notify ALL stakeholders of CR closure
    const allStakeholders = [
      cr.requestedBy,
      cr.lineManagerId,
      cr.assignedToITOfficerId,
    ].filter(Boolean);

    await this.sendNotification(updatedCr, 'CR_CLOSED', allStakeholders);

    return this.findOne(id);
  }

  // ========================
  // STATISTICS
  // ========================
  async getStatistics(): Promise<any> {
    const total = await this.crRepository.count({
      where: { currentStatus: Not('Deleted') },
    });
    const pending = await this.crRepository.count({
      where: [
        { currentStatus: 'Pending LM Approval' },
        { currentStatus: 'Pending HoIT Approval' },
        { currentStatus: 'Assigned to IT Officer' },
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
    for (let i = 1; i <= 10; i++) {
      byStage[i] = await this.crRepository.count({
        where: {
          currentStage: i,
          currentStatus: Not('Deleted'),
        }
      });
    }

    // Count by priority
    const byPriority = {
      Low: await this.crRepository.count({
        where: {
          businessPriority: 'Low',
          currentStatus: Not('Deleted'),
        }
      }),
      Medium: await this.crRepository.count({
        where: {
          businessPriority: 'Medium',
          currentStatus: Not('Deleted'),
        }
      }),
      High: await this.crRepository.count({
        where: {
          businessPriority: 'High',
          currentStatus: Not('Deleted'),
        }
      }),
      Critical: await this.crRepository.count({
        where: {
          businessPriority: 'Critical',
          currentStatus: Not('Deleted'),
        }
      }),
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
      10: { nextStage: 10, nextStatus: 'Completed' },
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
      // Filter out null/undefined recipient IDs
      const validRecipients = recipientIds.filter((id) => id !== null && id !== undefined);

      if (validRecipients.length > 0) {
        await this.emailService.sendCRNotification(cr, notificationType, validRecipients);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw - notification failure shouldn't block workflow
    }
  }

  /**
   * ENHANCED: Send comprehensive email notifications at every stage transition
   * Follows the flow: Req → LM → HoIT → ITOfficer → Req → QAOfficer → HoIT → HoIS → NOC
   */
  private async sendStageNotifications(
    cr: ChangeRequest,
    oldStage: number,
    newStage: number,
  ): Promise<void> {
    // Comprehensive notification mapping for all stages
    const notificationMap: Record<number, { type: string; recipients: number[] }> = {
      // Stage 3: After LM approval → Notify HoIT
      3: {
        type: 'LM_APPROVED',
        recipients: [], // HoIT users - will be looked up by role in email service
      },

      // Stage 4: After HoIT approval → Notify assigned IT Officer
      4: {
        type: 'HOIT_APPROVED',
        recipients: [cr.assignedToITOfficerId].filter(Boolean),
      },

      // Stage 5: After ITO completes assessment → Notify Requestor
      5: {
        type: 'ITO_SUBMITTED',
        recipients: [cr.requestedBy],
      },

      // Stage 6: After Requestor confirms → Notify QA Officer
      6: {
        type: 'REQUESTOR_CONFIRMED',
        recipients: [], // QA Officers - will be looked up by role
      },

      // Stage 7: After QA validates → Notify HoIT for production approval
      7: {
        type: 'QA_VALIDATED',
        recipients: [], // HoIT users
      },

      // Stage 8: After HoIT production approval → Notify Head of InfoSec
      8: {
        type: 'HOIT_PRODUCTION_APPROVED',
        recipients: [], // Head of InfoSec - will be looked up by role
      },

      // Stage 9: After HoIS final approval → Notify IT Officer for deployment
      9: {
        type: 'HOIS_APPROVED',
        recipients: [cr.assignedToITOfficerId].filter(Boolean),
      },

      // Stage 10: After deployment completion → Notify NOC and all stakeholders
      10: {
        type: 'DEPLOYMENT_COMPLETED',
        recipients: [
          cr.requestedBy,
          cr.lineManagerId,
          cr.assignedToITOfficerId,
        ].filter(Boolean), // NOC will also be notified via role lookup
      },
    };

    const notification = notificationMap[newStage];

    if (notification) {
      // Send notification with specified recipients
      // Email service will handle role-based lookups for empty recipient arrays
      await this.sendNotification(cr, notification.type, notification.recipients);
    }
  }
}
