import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  IsEnum,
  ValidateNested,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum BusinessPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum DowntimeUnit {
  MINUTES = 'Minutes',
  HOURS = 'Hours',
  DAYS = 'Days',
}

export enum CRCategory {
  APPLICATION = 'APPLICATION',
  SERVERS = 'SERVERS',
  NETWORK_DEVICES = 'NETWORK DEVICES',
  POS_APPLICATION = 'POS APPLICATION',
  MERCHANT_SUPPORT = 'MERCHANT SUPPORT',
}

// Stage 1: Create CR
export class CreateChangeRequestDto {
  @ApiProperty({ description: 'Purpose of the change' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  purposeOfChange: string;

  @ApiProperty({ description: 'Detailed description of the change' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  descriptionOfChange: string;

  @ApiProperty({ description: 'Line Manager ID' })
  @IsNumber()
  lineManagerId: number;

  @ApiProperty({ enum: BusinessPriority })
  @IsEnum(BusinessPriority)
  businessPriority: BusinessPriority;

  @ApiPropertyOptional({ description: 'Justification for high priority' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  priorityJustification?: string;

  @ApiPropertyOptional({ description: 'Base64 encoded signature' })
  @IsOptional()
  @IsString()
  requestorSignature?: string;
}

// Approval DTO
export class ApproveChangeRequestDto {
  @ApiPropertyOptional({ description: 'Signature file path or base64' })
  @IsOptional()
  @IsString()
  signatureFilePath?: string;

  @ApiPropertyOptional({ description: 'Approval comments' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;

  @ApiPropertyOptional({ description: 'IT Officer ID to assign (Stage 3)' })
  @IsOptional()
  @IsNumber()
  assignedToITOfficerId?: number;

  @ApiPropertyOptional({ description: 'Risk acceptance flag (Stage 7)' })
  @IsOptional()
  @IsBoolean()
  riskAccepted?: boolean;
}

// Rejection DTO
export class RejectChangeRequestDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({ description: 'Signature file path or base64' })
  @IsOptional()
  @IsString()
  signatureFilePath?: string;

  @ApiPropertyOptional({ description: 'Additional comments' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}

// Stage 4: IT Officer Assessment
export class UpdateITOfficerFieldsDto {
  @ApiProperty({ enum: CRCategory })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Subcategory based on category' })
  @IsString()
  @IsNotEmpty()
  subcategory: string;

  @ApiProperty({ description: 'Whether change impacts client service' })
  @IsBoolean()
  impactsClientService: boolean;

  @ApiProperty({ description: 'Impact assessment details' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  impactAssessment: string;

  @ApiProperty({ description: 'Backout/Rollback plan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  backoutRollbackPlan: string;

  @ApiProperty({ description: 'Expected downtime value' })
  @IsNumber()
  @Min(0)
  expectedDowntimeValue: number;

  @ApiProperty({ enum: DowntimeUnit })
  @IsEnum(DowntimeUnit)
  expectedDowntimeUnit: DowntimeUnit;

  @ApiPropertyOptional({ description: 'Cost involved in BHD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costInvolved?: number;

  @ApiProperty({ description: 'Planned deployment date and time' })
  @IsDateString()
  plannedDatetime: string;

  @ApiProperty({ description: 'Last backup date' })
  @IsDateString()
  lastBackupDate: string;
}

// Testing Result Item
export class TestResultItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  testCase: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expectedResult: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  actualResult: string;

  @ApiProperty()
  @IsBoolean()
  passed: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

// Add Testing Results
export class AddTestingResultsDto {
  @ApiProperty({ description: 'Type of testing' })
  @IsString()
  @IsNotEmpty()
  testType: string;

  @ApiProperty({ type: [TestResultItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestResultItemDto)
  testResults: TestResultItemDto[];

  @ApiProperty({ description: 'Overall pass/fail status' })
  @IsBoolean()
  passed: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// QA Checklist Item
export class QAChecklistItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  checkItem: string;

  @ApiProperty()
  @IsBoolean()
  checked: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

// Add QA Checklist
export class AddQAChecklistDto {
  @ApiProperty({ type: [QAChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QAChecklistItemDto)
  checklistData: QAChecklistItemDto[];

  @ApiProperty({ description: 'Whether all items are validated' })
  @IsBoolean()
  validated: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

// Add Deployment Team Member
export class AddDeploymentTeamMemberDto {
  @ApiProperty({ description: 'Team member name' })
  @IsString()
  @IsNotEmpty()
  memberName: string;

  @ApiPropertyOptional({ description: 'Designation/Job title' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ description: 'Contact information' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ description: 'Role in deployment' })
  @IsOptional()
  @IsString()
  role?: string;
}

// NOC Closure
export class CloseChangeRequestDto {
  @ApiProperty({ description: 'NOC closure notes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  nocClosureNotes: string;

  @ApiProperty({ description: 'Whether an incident was triggered' })
  @IsBoolean()
  incidentTriggered: boolean;

  @ApiPropertyOptional({ description: 'Incident details if triggered' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  incidentDetails?: string;

  @ApiProperty({ description: 'Whether rollback was triggered' })
  @IsBoolean()
  rollbackTriggered: boolean;

  @ApiPropertyOptional({ description: 'Rollback details if triggered' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rollbackDetails?: string;

  @ApiPropertyOptional({ description: 'Justification for early closure (< 48 hours)' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  nocClosureJustification?: string;

  @ApiPropertyOptional({ description: 'NOC officer signature' })
  @IsOptional()
  @IsString()
  signatureFilePath?: string;
}

// Search/Filter DTO
export class SearchChangeRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  stage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
