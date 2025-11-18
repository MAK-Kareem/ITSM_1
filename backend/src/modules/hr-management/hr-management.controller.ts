import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HrManagementService } from './hr-management.service';

@ApiTags('HR Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrManagementController {
  constructor(private readonly hrService: HrManagementService) {}

  @Post('employees')
  @ApiOperation({ summary: 'Create employee' })
  createEmployee(@Body() createDto: any) {
    return this.hrService.createEmployee(createDto);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get all employees' })
  findAllEmployees() {
    return this.hrService.findAllEmployees();
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  findEmployeeById(@Param('id') id: string) {
    return this.hrService.findEmployeeById(+id);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  updateEmployee(@Param('id') id: string, @Body() updateDto: any) {
    return this.hrService.updateEmployee(+id, updateDto);
  }

  @Get('employees/department/:department')
  @ApiOperation({ summary: 'Get employees by department' })
  findEmployeesByDepartment(@Param('department') department: string) {
    return this.hrService.findEmployeesByDepartment(department);
  }

  @Post('leave-requests')
  @ApiOperation({ summary: 'Create leave request' })
  createLeaveRequest(@Body() createDto: any) {
    return this.hrService.createLeaveRequest(createDto);
  }

  @Get('leave-requests')
  @ApiOperation({ summary: 'Get all leave requests' })
  findAllLeaveRequests() {
    return this.hrService.findAllLeaveRequests();
  }

  @Get('leave-requests/:id')
  @ApiOperation({ summary: 'Get leave request by ID' })
  findLeaveRequestById(@Param('id') id: string) {
    return this.hrService.findLeaveRequestById(+id);
  }

  @Patch('leave-requests/:id/approve')
  @ApiOperation({ summary: 'Approve leave request' })
  approveLeaveRequest(@Param('id') id: string, @Body() body: { approverId: number; comments: string }) {
    return this.hrService.approveLeaveRequest(+id, body.approverId, body.comments);
  }

  @Patch('leave-requests/:id/reject')
  @ApiOperation({ summary: 'Reject leave request' })
  rejectLeaveRequest(@Param('id') id: string, @Body() body: { approverId: number; comments: string }) {
    return this.hrService.rejectLeaveRequest(+id, body.approverId, body.comments);
  }
}
