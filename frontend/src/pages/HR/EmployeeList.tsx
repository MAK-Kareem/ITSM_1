import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Modal, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const employeeColumns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: any) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Status',
      dataIndex: 'employmentStatus',
      key: 'employmentStatus',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" size="small">View</Button>
          <Button type="link" size="small">Edit</Button>
        </Space>
      ),
    },
  ];

  const leaveColumns = [
    {
      title: 'Request #',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: any) => record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'N/A',
    },
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Days',
      dataIndex: 'numberOfDays',
      key: 'numberOfDays',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'processing',
          approved: 'success',
          rejected: 'error',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small">Approve</Button>
              <Button type="link" danger size="small">Reject</Button>
            </>
          )}
          <Button type="link" size="small">View</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>HR Management</h1>

      <Tabs
        items={[
          {
            key: '1',
            label: <span><UserOutlined />Employees</span>,
            children: (
              <>
                <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
                  <Input
                    placeholder="Search employees..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300 }}
                  />
                  <Button type="primary" icon={<PlusOutlined />}>
                    Add Employee
                  </Button>
                </Space>
                <Table columns={employeeColumns} dataSource={employees} rowKey="id" loading={loading} />
              </>
            ),
          },
          {
            key: '2',
            label: <span><CalendarOutlined />Leave Requests</span>,
            children: (
              <>
                <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
                  <Input
                    placeholder="Search leave requests..."
                    prefix={<SearchOutlined />}
                    style={{ width: 300 }}
                  />
                  <Button type="primary" icon={<PlusOutlined />}>
                    Request Leave
                  </Button>
                </Space>
                <Table columns={leaveColumns} dataSource={leaveRequests} rowKey="id" loading={loading} />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default EmployeeList;
