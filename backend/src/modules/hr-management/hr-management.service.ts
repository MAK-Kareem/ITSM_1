import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { LeaveRequest } from './entities/leave-request.entity';

@Injectable()
export class HrManagementService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(LeaveRequest)
    private leaveRequestRepository: Repository<LeaveRequest>,
  ) {}

  async createEmployee(createDto: any): Promise<Employee> {
    const employeeId = await this.generateEmployeeId();
    const employee = this.employeeRepository.create({
      ...createDto,
      employeeId,
    });
    const saved = await this.employeeRepository.save(employee);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAllEmployees(): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { employmentStatus: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async findEmployeeById(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async updateEmployee(id: number, updateDto: any): Promise<Employee> {
    const employee = await this.findEmployeeById(id);
    Object.assign(employee, updateDto);
    const saved = await this.employeeRepository.save(employee);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findEmployeesByDepartment(department: string): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { department, employmentStatus: 'active' },
      order: { lastName: 'ASC' },
    });
  }

  async createLeaveRequest(createDto: any): Promise<LeaveRequest> {
    const requestNumber = await this.generateLeaveRequestNumber();
    const leaveRequest = this.leaveRequestRepository.create({
      ...createDto,
      requestNumber,
    });
    const saved = await this.leaveRequestRepository.save(leaveRequest);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAllLeaveRequests(): Promise<LeaveRequest[]> {
    return this.leaveRequestRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findLeaveRequestById(id: number): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }
    return request;
  }

  async approveLeaveRequest(id: number, approverId: number, comments: string): Promise<LeaveRequest> {
    const request = await this.findLeaveRequestById(id);
    request.status = 'approved';
    request.approvedBy = approverId;
    request.approvalDate = new Date();
    request.comments = comments;
    const saved = await this.leaveRequestRepository.save(request);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async rejectLeaveRequest(id: number, approverId: number, comments: string): Promise<LeaveRequest> {
    const request = await this.findLeaveRequestById(id);
    request.status = 'rejected';
    request.approvedBy = approverId;
    request.approvalDate = new Date();
    request.comments = comments;
    const saved = await this.leaveRequestRepository.save(request);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async generateEmployeeId(): Promise<string> {
    const count = await this.employeeRepository.count();
    const sequence = String(count + 1).padStart(5, '0');
    return `EMP${sequence}`;
  }

  private async generateLeaveRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.leaveRequestRepository.count();
    const sequence = String(count + 1).padStart(4, '0');
    return `LR-${year}-${sequence}`;
  }
}
