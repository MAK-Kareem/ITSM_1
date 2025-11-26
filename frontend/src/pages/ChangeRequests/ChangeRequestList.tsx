import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, message, Tooltip, Switch, Card, Row, Col } from 'antd';
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
import { ChangeRequest, CR_STAGES, CR_PRIORITY_COLORS } from '../../types/change-request.types';
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
  const [viewAll, setViewAll] = useState(false);
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadChangeRequests();
  }, [viewAll]);

  const loadChangeRequests = async () => {
    setLoading(true);
    try {
      const data = await changeRequestService.getByRole(viewAll);
      setChangeRequests(data);
    } catch (error: any) {
      message.error('Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

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

  const getStageName = (stage: number) => {
    const stageInfo = CR_STAGES.find(s => s.stage === stage);
    return stageInfo ? stageInfo.name : `Stage ${stage}`;
  };

  // Helper for solid colored status tags
  const getStatusStyle = (status: string): React.CSSProperties => {
    const statusUpper = status.toUpperCase();
    let backgroundColor = '#8c8c8c'; // Default Grey
    let color = '#ffffff';

    if (statusUpper === 'DRAFT') {
      backgroundColor = '#595959';
    } else if (statusUpper === 'REJECTED') {
      backgroundColor = '#ff4d4f'; // Red
    } else if (statusUpper === 'COMPLETED' || statusUpper === 'READY TO DEPLOY') {
      backgroundColor = '#52c41a'; // Green
    } else if (statusUpper.includes('WAITING') || statusUpper.includes('REQUIRED')) {
      backgroundColor = '#faad14'; // Orange/Gold
    } else if (statusUpper.includes('QA')) {
      backgroundColor = '#722ed1'; // Purple
    } else if (statusUpper.includes('INFOSEC')) {
      backgroundColor = '#eb2f96'; // Magenta
    } else if (statusUpper.includes('PENDING') || statusUpper.includes('ASSIGNED')) {
      backgroundColor = '#1890ff'; // Blue
    }

    return {
      backgroundColor,
      color,
      border: 'none',
      fontWeight: 600,
      textAlign: 'center',
      width: '100%',
      display: 'inline-block',
      fontSize: '11px',
      padding: '4px 0',
      borderRadius: '4px'
    };
  };

  const canApprove = (cr: ChangeRequest) => {
    if (!currentUser) return false;
    const stageInfo = CR_STAGES.find(s => s.stage === cr.currentStage);
    return stageInfo && currentUser.role === stageInfo.role && cr.currentStatus.includes('Pending');
  };

  const canEditOrDeleteCR = (cr: ChangeRequest): boolean => {
    if (!currentUser) return false;

    if (cr.currentStatus === 'Completed' || cr.currentStatus === 'Rejected') {
      return false;
    }

    const stage = cr.currentStage;
    const userRoles: string[] = currentUser.roles || [currentUser.role];

    if (stage === 2) {
      return cr.requestedBy === currentUser.id;
    }

    if (stage === 3) {
      return userRoles.includes('line_manager');
    }

    if (stage >= 4 && stage < 10) {
      return userRoles.includes('head_of_it');
    }

    return false;
  };

  const handleApprove = (cr: ChangeRequest) => {
    navigate(`/change-requests/${cr.id}`);
  };

  const handleReject = (cr: ChangeRequest) => {
    navigate(`/change-requests/${cr.id}`);
  };

  const handleEditCR = (cr: ChangeRequest) => {
    setSelectedCR(cr);
    setEditModalVisible(true);
  };

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

  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setSelectedCR(null);
    loadChangeRequests();
  };

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
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        matchesStatus = !['Completed', 'Rejected'].includes(cr.currentStatus);
      } else if (statusFilter === 'completed') {
        matchesStatus = cr.currentStatus === 'Completed';
      } else if (statusFilter === 'rejected') {
        matchesStatus = cr.currentStatus === 'Rejected';
      } else if (statusFilter === 'draft') {
        matchesStatus = cr.currentStatus === 'Draft';
      }
    }
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'CR Number',
      dataIndex: 'crNumber',
      key: 'crNumber',
      width: 130,
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
      // Takes remaining space
    },
    {
      title: 'Requested By',
      key: 'requestedBy',
      width: 160,
      render: (_: any, record: ChangeRequest) => (
        record.requester ? `${record.requester.firstName} ${record.requester.lastName}` : 'N/A'
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'businessPriority',
      key: 'businessPriority',
      width: 100, // Reduced Width
      render: (priority: string) => (
        <Tag color={CR_PRIORITY_COLORS[priority] || 'default'}>{priority}</Tag>
      ),
    },
    {
      title: 'Current Stage',
      dataIndex: 'currentStage',
      key: 'currentStage',
      width: 170, // Increased Width to prevent wrapping
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
      width: 200, // Fixed width for long status pills
      render: (status: string) => (
        <Tag style={getStatusStyle(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 140, // Increased Width to keep text on one line
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: ChangeRequest) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/change-requests/${record.id}`)}
            />
          </Tooltip>

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
          <Card 
            hoverable
            style={{ 
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              height: '65px',
              padding: '0',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 8px rgba(24, 144, 255, 0.25)',
              overflow: 'hidden',
              position: 'relative'
            }}
            bodyStyle={{ 
              padding: '14px 16px', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '12px', fontWeight: 500 }}>Total CRs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: 'white', fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>{stats.total}</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable
            style={{ 
              background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
              height: '65px',
              padding: '0',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 8px rgba(250, 173, 20, 0.25)',
              overflow: 'hidden',
              position: 'relative'
            }}
            bodyStyle={{ 
              padding: '14px 16px', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '12px', fontWeight: 500 }}>In Progress</span>
              <ClockCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: 'white', fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>{stats.pending}</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable
            style={{ 
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              height: '65px',
              padding: '0',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 8px rgba(82, 196, 26, 0.25)',
              overflow: 'hidden',
              position: 'relative'
            }}
            bodyStyle={{ 
              padding: '14px 16px', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '12px', fontWeight: 500 }}>Completed</span>
              <CheckCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: 'white', fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>{stats.completed}</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card 
            hoverable
            style={{ 
              background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
              height: '65px',
              padding: '0',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 8px rgba(255, 77, 79, 0.25)',
              overflow: 'hidden',
              position: 'relative'
            }}
            bodyStyle={{ 
              padding: '14px 16px', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              position: 'relative',
              zIndex: 2
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '12px', fontWeight: 500 }}>Rejected</span>
              <CloseCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: 'white', fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>{stats.rejected}</span>
            </div>
          </Card>
        </Col>
      </Row>

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
        bordered={true}
      />

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