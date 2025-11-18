import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, message, Tooltip } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ChangeRequest, CR_STAGES } from '../../types/change-request.types';
import changeRequestService from '../../services/change-request.service';
import authService from '../../services/auth.service';
import dayjs from 'dayjs';

const ChangeRequestList: React.FC = () => {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadChangeRequests();
  }, []);

  const loadChangeRequests = async () => {
    setLoading(true);
    try {
      const data = await changeRequestService.getAll();
      setChangeRequests(data);
    } catch (error: any) {
      message.error('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      pending: 'processing',
      approved: 'success',
      rejected: 'error',
      completed: 'success',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'green',
      Medium: 'orange',
      High: 'red',
      Critical: 'red',
    };
    return colors[priority] || 'default';
  };

  const getStageName = (stage: number) => {
    const stageInfo = CR_STAGES.find(s => s.stage === stage);
    return stageInfo ? stageInfo.name : `Stage ${stage}`;
  };

  const canApprove = (cr: ChangeRequest) => {
    if (!currentUser) return false;
    const stageInfo = CR_STAGES.find(s => s.stage === cr.currentStage);
    return stageInfo && currentUser.role === stageInfo.role && cr.currentStatus === 'pending';
  };

  const handleApprove = (cr: ChangeRequest) => {
    Modal.confirm({
      title: 'Approve Change Request',
      content: 'Are you sure you want to approve this change request?',
      onOk: async () => {
        try {
          await changeRequestService.approve(cr.id, {});
          message.success('Change request approved successfully');
          loadChangeRequests();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to approve');
        }
      },
    });
  };

  const handleReject = (cr: ChangeRequest) => {
    let reason = '';
    Modal.confirm({
      title: 'Reject Change Request',
      content: (
        <div>
          <p>Are you sure you want to reject this change request?</p>
          <Input.TextArea
            placeholder="Enter rejection reason..."
            onChange={(e) => reason = e.target.value}
            rows={3}
          />
        </div>
      ),
      onOk: async () => {
        if (!reason.trim()) {
          message.error('Please provide a rejection reason');
          return Promise.reject();
        }
        try {
          await changeRequestService.reject(cr.id, { reason });
          message.success('Change request rejected');
          loadChangeRequests();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to reject');
        }
      },
    });
  };

  const filteredCRs = changeRequests.filter((cr) => {
    const matchesSearch = Object.values(cr).some((value) =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || cr.currentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'CR Number',
      dataIndex: 'crNumber',
      key: 'crNumber',
      render: (text: string, record: ChangeRequest) => (
        <Button type="link" onClick={() => navigate(`/change-requests/${record.id}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Purpose',
      dataIndex: 'purposeOfChange',
      key: 'purposeOfChange',
      ellipsis: true,
    },
    {
      title: 'Requested By',
      key: 'requestedBy',
      render: (_: any, record: ChangeRequest) => (
        record.requester ? `${record.requester.firstName} ${record.requester.lastName}` : 'N/A'
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'businessPriority',
      key: 'businessPriority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
    },
    {
      title: 'Current Stage',
      dataIndex: 'currentStage',
      key: 'currentStage',
      render: (stage: number) => (
        <Tooltip title={getStageName(stage)}>
          <Tag color="blue">{stage}/10</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'currentStatus',
      key: 'currentStatus',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ChangeRequest) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/change-requests/${record.id}`)}
            />
          </Tooltip>
          {canApprove(record) && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="link"
                  icon={<CheckCircleOutlined />}
                  style={{ color: 'green' }}
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="link"
                  icon={<CloseCircleOutlined />}
                  danger
                  onClick={() => handleReject(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1>Change Requests</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/change-requests/create')}
        >
          Create Change Request
        </Button>
      </Space>

      <Space style={{ marginBottom: 16, width: '100%' }}>
        <Input
          placeholder="Search change requests..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
        >
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="draft">Draft</Select.Option>
          <Select.Option value="pending">Pending</Select.Option>
          <Select.Option value="approved">Approved</Select.Option>
          <Select.Option value="rejected">Rejected</Select.Option>
          <Select.Option value="completed">Completed</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredCRs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ChangeRequestList;
