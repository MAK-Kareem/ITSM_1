import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, message, Tooltip, Switch, Card, Row, Col, Statistic } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ChangeRequest, CR_STAGES } from '../../types/change-request.types';
import changeRequestService from '../../services/change-request.service';
import authService from '../../services/auth.service';
import EditChangeRequestModal from './components/EditChangeRequestModal';
import dayjs from 'dayjs';

const ChangeRequestList: React.FC = () => {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);
  const [viewAll, setViewAll] = useState(false); // NEW: View All toggle state
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadChangeRequests();
  }, [viewAll]); // Reload when viewAll toggle changes

  const loadChangeRequests = async () => {
    setLoading(true);
    try {
      // Use role-based filtering with viewAll toggle
      const data = await changeRequestService.getByRole(viewAll);
      setChangeRequests(data);
    } catch (error: any) {
      message.error('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Get role-specific description for View All toggle
  const getRoleDescription = (): string => {
    if (!currentUser) return 'your';

    const role = currentUser.role;
    const roleDescriptions: Record<string, string> = {
      requestor: 'my',
      line_manager: 'assigned to me',
      head_of_it: 'approved by Line Manager',
      it_officer: 'assigned to me',
      qa_officer: 'pending QA validation',
      head_of_infosec: 'pending InfoSec approval',
      noc: 'awaiting NOC closure',
    };

    return roleDescriptions[role] || 'relevant';
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

  // NEW: Check if user can edit/delete a CR based on baton pass logic
  const canEditOrDeleteCR = (cr: ChangeRequest): boolean => {
    if (!currentUser) return false;

    // Cannot edit completed or rejected CRs
    if (cr.currentStatus === 'Completed' || cr.currentStatus === 'Rejected') {
      return false;
    }

    const stage = cr.currentStage;
    const userRoles: string[] = currentUser.roles || [currentUser.role];

    // Stage 2: Only requestor can edit
    if (stage === 2) {
      return cr.requestedBy === currentUser.id;
    }

    // Stage 3: Only line manager can edit
    if (stage === 3) {
      return userRoles.includes('line_manager');
    }

    // Stage 4+: Only Head of IT can edit
    if (stage >= 4 && stage < 10) {
      return userRoles.includes('head_of_it');
    }

    // Stage 10 or beyond: No one can edit
    return false;
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

  // NEW: Handle edit CR
  const handleEditCR = (cr: ChangeRequest) => {
    setSelectedCR(cr);
    setEditModalVisible(true);
  };

  // NEW: Handle delete CR
  const handleDeleteCR = (cr: ChangeRequest) => {
    Modal.confirm({
      title: 'Delete Change Request',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete <strong>{cr.crNumber}</strong>?</p>
          <p style={{ color: '#ff4d4f' }}>This action cannot be undone.</p>
        </div>
      ),
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await changeRequestService.delete(cr.id);
          message.success('Change request deleted successfully');
          loadChangeRequests();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to delete change request');
        }
      },
    });
  };

  // NEW: Handle edit success
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setSelectedCR(null);
    loadChangeRequests();
  };

  // Calculate stats
  const stats = {
    total: changeRequests.length,
    pending: changeRequests.filter((cr) => !['Completed', 'Rejected'].includes(cr.currentStatus)).length,
    completed: changeRequests.filter((cr) => cr.currentStatus === 'Completed').length,
    rejected: changeRequests.filter((cr) => cr.currentStatus === 'Rejected').length,
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
      width: 200,
      render: (_: any, record: ChangeRequest) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/change-requests/${record.id}`)}
            />
          </Tooltip>

          {/* NEW: Edit button - shown only if user can edit */}
          {canEditOrDeleteCR(record) && (
            <Tooltip title="Edit">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditCR(record)}
                style={{ color: '#1890ff' }}
              />
            </Tooltip>
          )}

          {/* NEW: Delete button - shown only if user can delete */}
          {canEditOrDeleteCR(record) && (
            <Tooltip title="Delete">
              <Button
                type="link"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteCR(record)}
                danger
              />
            </Tooltip>
          )}

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

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card style={{ backgroundColor: '#1890ff', height: '80px', padding: '12px' }}>
            <Statistic 
              title={<span style={{ color: 'white', fontSize: '13px' }}>Total CRs</span>} 
              value={stats.total}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ backgroundColor: '#faad14', height: '80px', padding: '12px' }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: '13px' }}>In Progress</span>}
              value={stats.pending}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ backgroundColor: '#52c41a', height: '80px', padding: '12px' }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: '13px' }}>Completed</span>}
              value={stats.completed}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
              prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ backgroundColor: '#ff4d4f', height: '80px', padding: '12px' }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: '13px' }}>Rejected</span>}
              value={stats.rejected}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
              prefix={<CloseCircleOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* NEW: View All Toggle */}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <span style={{ fontWeight: 500 }}>
            Showing: {viewAll ? 'All CRs' : `CRs ${getRoleDescription()}`}
          </span>
          <Switch
            checked={viewAll}
            onChange={setViewAll}
            checkedChildren="View All"
            unCheckedChildren="My View"
          />
          {!viewAll && (
            <Tag color="blue" style={{ marginLeft: 8 }}>
              Filtered by Role
            </Tag>
          )}
        </Space>
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

      {/* NEW: Edit Modal */}
      {selectedCR && (
        <EditChangeRequestModal
          visible={editModalVisible}
          cr={selectedCR}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedCR(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ChangeRequestList;
