import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangeManagementService } from './change-management.service';
import { FileUploadService } from '../../common/services/file-upload.service';
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

@ApiTags('Change Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('change-requests')
export class ChangeManagementController {
  constructor(
    private readonly crService: ChangeManagementService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // Helper method to determine the appropriate role for a given stage from user's roles
  private getApplicableRole(userRoles: string[], stage: number): string {
    const stageRoleMap: Record<number, string[]> = {
      2: ['line_manager'],
      3: ['head_of_it'],
      4: ['it_officer'],
      5: ['requestor'],
      6: ['qa_officer'],
      7: ['head_of_it'],
      8: ['head_of_infosec'],
      9: ['it_officer'],
      10: ['noc'],
    };

    const allowedRoles = stageRoleMap[stage] || [];

    // Find which of the user's roles matches the allowed roles for this stage
    for (const allowedRole of allowedRoles) {
      if (userRoles.includes(allowedRole)) {
        return allowedRole;
      }
    }

    // Fallback to primary role if no match found
    return userRoles[0] || 'requestor';
  }

  // ========================
  // CRUD OPERATIONS
  // ========================

  @Post()
  @ApiOperation({ summary: 'Create new change request (Stage 1)' })
  @ApiResponse({ status: 201, description: 'CR created successfully' })
  async create(@Body() createDto: CreateChangeRequestDto, @Request() req) {
    return this.crService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all change requests' })
  @ApiResponse({ status: 200, description: 'List of all CRs' })
  async findAll() {
    return this.crService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search and filter change requests' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'stage', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  async search(@Query() searchDto: SearchChangeRequestDto) {
    return this.crService.search(searchDto);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get my change requests' })
  @ApiResponse({ status: 200, description: 'List of user CRs' })
  async findMyRequests(@Request() req) {
    return this.crService.findByUser(req.user.userId);
  }

  @Get('by-role')
  @ApiOperation({ summary: 'Get CRs filtered by user role (with View All toggle)' })
  @ApiQuery({ name: 'viewAll', required: false, type: Boolean, description: 'Show all CRs regardless of role' })
  @ApiResponse({ status: 200, description: 'List of role-filtered CRs' })
  async findByRole(@Request() req, @Query('viewAll') viewAll?: string) {
    const userRoles: string[] = req.user.roles || [req.user.role];
    const primaryRole = userRoles[0] || req.user.role;
    const showAll = viewAll === 'true';

    return this.crService.findByRole(req.user.userId, primaryRole, showAll);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get CR statistics' })
  @ApiResponse({ status: 200, description: 'CR statistics' })
  async getStatistics() {
    return this.crService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get change request by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'CR details' })
  @ApiResponse({ status: 404, description: 'CR not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.crService.findOne(id);
  }

  // ========================
  // NEW: EDIT/DELETE OPERATIONS (BATON PASS)
  // ========================

  @Patch(':id')
  @ApiOperation({ summary: 'Update/Edit a change request (with baton pass permissions)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'CR updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to edit this CR' })
  @ApiResponse({ status: 400, description: 'Cannot edit completed/rejected CR' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateChangeRequestDto>,
    @Request() req,
  ) {
    // Get user's roles array (support both single role and multi-role)
    const userRoles: string[] = req.user.roles || [req.user.role];

    return this.crService.update(id, updateDto, req.user.userId, userRoles);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a change request (with baton pass permissions)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'CR deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized to delete this CR' })
  @ApiResponse({ status: 400, description: 'Cannot delete completed CR' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Get user's roles array (support both single role and multi-role)
    const userRoles: string[] = req.user.roles || [req.user.role];

    await this.crService.remove(id, req.user.userId, userRoles);

    return {
      message: 'Change request deleted successfully',
      id,
    };
  }

  @Get(':id/can-edit-or-delete')
  @ApiOperation({ summary: 'Check if current user can edit or delete this CR' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  async canEditOrDelete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Get user's roles array (support both single role and multi-role)
    const userRoles: string[] = req.user.roles || [req.user.role];

    const canEdit = await this.crService.canEditOrDelete(id, req.user.userId, userRoles);

    return {
      canEdit,
      canDelete: canEdit, // Same permissions for edit and delete
    };
  }

  // ========================
  // APPROVAL WORKFLOW
  // ========================

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve change request at current stage' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'CR approved' })
  @ApiResponse({ status: 400, description: 'Invalid approval' })
  @ApiResponse({ status: 403, description: 'Not authorized to approve' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() approvalDto: ApproveChangeRequestDto,
    @Request() req,
  ) {
    // Get the CR to know which stage we're approving
    const cr = await this.crService.findOne(id);

    // Get the user's roles array (support both single role and multi-role)
    const userRoles: string[] = req.user.roles || [req.user.role];

    // Determine which role applies to this stage
    const applicableRole = this.getApplicableRole(userRoles, cr.currentStage);

    return this.crService.approve(id, approvalDto, req.user.userId, applicableRole);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject change request' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'CR rejected' })
  @ApiResponse({ status: 400, description: 'Invalid rejection' })
  @ApiResponse({ status: 403, description: 'Not authorized to reject' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectionDto: RejectChangeRequestDto,
    @Request() req,
  ) {
    // Get the CR to know which stage we're rejecting
    const cr = await this.crService.findOne(id);

    // Get the user's roles array (support both single role and multi-role)
    const userRoles: string[] = req.user.roles || [req.user.role];

    // Determine which role applies to this stage
    const applicableRole = this.getApplicableRole(userRoles, cr.currentStage);

    return this.crService.reject(id, rejectionDto, req.user.userId, applicableRole);
  }

  // ========================
  // IT OFFICER ASSESSMENT (Stage 4)
  // ========================

  @Patch(':id/ito-fields')
  @ApiOperation({ summary: 'Update IT Officer assessment fields (Stage 4)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'ITO fields updated' })
  @ApiResponse({ status: 400, description: 'Not at correct stage' })
  @ApiResponse({ status: 403, description: 'Not assigned IT Officer' })
  async updateITOFields(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateITOfficerFieldsDto,
    @Request() req,
  ) {
    return this.crService.updateITOfficerFields(id, updateDto, req.user.userId);
  }

  // ========================
  // TESTING RESULTS
  // ========================

  @Post(':id/testing-results')
  @ApiOperation({ summary: 'Add testing results' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Testing results added' })
  async addTestingResults(
    @Param('id', ParseIntPipe) id: number,
    @Body() testingDto: AddTestingResultsDto,
    @Request() req,
  ) {
    return this.crService.addTestingResults(id, testingDto, req.user.userId);
  }

  @Get(':id/testing-results')
  @ApiOperation({ summary: 'Get testing results' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Testing results' })
  async getTestingResults(@Param('id', ParseIntPipe) id: number) {
    return this.crService.getTestingResults(id);
  }

  // ========================
  // QA CHECKLIST
  // ========================

  @Post(':id/qa-checklist')
  @ApiOperation({ summary: 'Add QA validation checklist (Stage 6)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'QA checklist added' })
  async addQAChecklist(
    @Param('id', ParseIntPipe) id: number,
    @Body() checklistDto: AddQAChecklistDto,
    @Request() req,
  ) {
    return this.crService.addQAChecklist(id, checklistDto, req.user.userId);
  }

  @Get(':id/qa-checklists')
  @ApiOperation({ summary: 'Get QA checklists' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'QA checklists' })
  async getQAChecklists(@Param('id', ParseIntPipe) id: number) {
    return this.crService.getQAChecklists(id);
  }

  // ========================
  // DEPLOYMENT TEAM
  // ========================

  @Post(':id/deployment-team')
  @ApiOperation({ summary: 'Add deployment team member' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Team member added' })
  async addDeploymentTeamMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() memberDto: AddDeploymentTeamMemberDto,
  ) {
    return this.crService.addDeploymentTeamMember(id, memberDto);
  }

  @Get(':id/deployment-team')
  @ApiOperation({ summary: 'Get deployment team' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Deployment team list' })
  async getDeploymentTeam(@Param('id', ParseIntPipe) id: number) {
    return this.crService.getDeploymentTeam(id);
  }

  // ========================
  // FILE UPLOADS
  // ========================

  @Post(':id/upload-signature')
  @ApiOperation({ summary: 'Upload signature file' })
  @ApiParam({ name: 'id', type: Number })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 200, description: 'Signature uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadSignature(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.fileUploadService.validateSignature(file);
    const filePath = await this.fileUploadService.saveFile(file, 'signature');

    // Save as attachment
    await this.crService.addAttachment(
      id,
      {
        fileName: file.originalname,
        filePath: filePath,
        fileSize: file.size,
        fileType: 'SIGNATURE',
      },
      req.user.userId,
    );

    return { filePath };
  }

  @Post(':id/upload-document')
  @ApiOperation({ summary: 'Upload UAT documentation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 200, description: 'Document uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.fileUploadService.validateDocument(file);
    const filePath = await this.fileUploadService.saveFile(file, 'uat-document');

    await this.crService.addAttachment(
      id,
      {
        fileName: file.originalname,
        filePath: filePath,
        fileSize: file.size,
        fileType: 'UAT_DOCUMENTATION',
      },
      req.user.userId,
    );

    return { filePath };
  }

  // ========================
  // HISTORY & APPROVALS
  // ========================

  @Get(':id/history')
  @ApiOperation({ summary: 'Get CR history/audit trail' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'CR history' })
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.crService.getCRHistory(id);
  }

  @Get(':id/approvals')
  @ApiOperation({ summary: 'Get CR approvals' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'CR approvals' })
  async getApprovals(@Param('id', ParseIntPipe) id: number) {
    return this.crService.getCRApprovals(id);
  }

  // ========================
  // NOC CLOSURE (Stage 10)
  // ========================

  @Post(':id/close')
  @ApiOperation({ summary: 'Close CR (NOC - Stage 10)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'CR closed' })
  @ApiResponse({ status: 400, description: 'Not at closure stage or missing required fields' })
  async closeCR(
    @Param('id', ParseIntPipe) id: number,
    @Body() closureDto: CloseChangeRequestDto,
    @Request() req,
  ) {
    return this.crService.closeCR(id, closureDto, req.user.userId);
  }
}
