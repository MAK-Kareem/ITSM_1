import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, message, Tooltip, Card, Row, Col, Statistic, Badge } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  ChangeRequest,
  CR_STAGES,
  CR_STATUS_COLORS,
  CR_PRIORITY_COLORS,
  CR_PRIORITIES,
} from '../../types/change-request.types';
import changeRequestService from '../../services/change-request.service';
import authService from '../../services/auth.service';
import dayjs from 'dayjs';

const { Option } = Select;

const ChangeRequestListEnhanced: React.FC = () => {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<number | string>('all');
  const [showMyActions, setShowMyActions] = useState(false);
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

  const getStageName = (stage: number) => {
    const stageInfo = CR_STAGES.find((s) => s.stage === stage);
    return stageInfo ? stageInfo.name : `Stage ${stage}`;
  };

  const canActOnCR = (cr: ChangeRequest) => {
    if (!currentUser) return false;
    if (cr.currentStatus === 'Rejected' || cr.currentStatus === 'Completed') return false;

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

    const allowedRoles = stageRoleMap[cr.currentStage];
    if (!allowedRoles) return false;

    // Special check for requestor stage
    if (cr.currentStage === 5) {
      return cr.requestedBy === currentUser.id;
    }

    return allowedRoles.includes(currentUser.role);
  };

  const filteredCRs = changeRequests.filter((cr) => {
    // Text search
    const matchesSearch =
      !searchText ||
      cr.crNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      cr.purposeOfChange.toLowerCase().includes(searchText.toLowerCase()) ||
      cr.descriptionOfChange.toLowerCase().includes(searchText.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || cr.currentStatus === statusFilter;

    // Priority filter
    const matchesPriority = priorityFilter === 'all' || cr.businessPriority === priorityFilter;

    // Stage filter
    const matchesStage = stageFilter === 'all' || cr.currentStage === Number(stageFilter);

    // My actions filter
    const matchesMyActions = !showMyActions || canActOnCR(cr);

    return matchesSearch && matchesStatus && matchesPriority && matchesStage && matchesMyActions;
  });

  // Statistics
  const stats = {
    total: changeRequests.length,
    pending: changeRequests.filter((cr) => !['Completed', 'Rejected'].includes(cr.currentStatus)).length,
    completed: changeRequests.filter((cr) => cr.currentStatus === 'Completed').length,
    rejected: changeRequests.filter((cr) => cr.currentStatus === 'Rejected').length,
    myActions: changeRequests.filter((cr) => canActOnCR(cr)).length,
  };

  const columns = [
    {
      title: 'CR Number',
      dataIndex: 'crNumber',
      key: 'crNumber',
      width: 140,
      sorter: (a: ChangeRequest, b: ChangeRequest) => a.crNumber.localeCompare(b.crNumber),
      render: (text: string, record: ChangeRequest) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/change-requests/${record.id}`)}>
            {text}
          </Button>
          {canActOnCR(record) && (
            <Badge status="processing" title="Action Required" />
          )}
        </Space>
      ),
    },
    {
      title: 'Purpose',
      dataIndex: 'purposeOfChange',
      key: 'purposeOfChange',
      ellipsis: true,
      width: 250,
    },
    {
      title: 'Requested By',
      key: 'requestedBy',
      width: 150,
      render: (_: any, record: ChangeRequest) =>
        record.requester ? `${record.requester.firstName} ${record.requester.lastName}` : 'N/A',
    },
    {
      title: 'Priority',
      dataIndex: 'businessPriority',
      key: 'businessPriority',
      width: 100,
      filters: CR_PRIORITIES.map((p) => ({ text: p, value: p })),
      onFilter: (value: any, record: ChangeRequest) => record.businessPriority === value,
      render: (priority: string) => <Tag color={CR_PRIORITY_COLORS[priority] || 'default'}>{priority}</Tag>,
    },
    {
      title: 'Stage',
      dataIndex: 'currentStage',
      key: 'currentStage',
      width: 180,
      sorter: (a: ChangeRequest, b: ChangeRequest) => a.currentStage - b.currentStage,
      render: (stage: number) => (
        <Tooltip title={getStageName(stage)}>
          <Tag color="blue">
            {stage}/10 - {getStageName(stage)}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'currentStatus',
      key: 'currentStatus',
      width: 200,
      render: (status: string) => (
        <Tag color={CR_STATUS_COLORS[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 120,
      sorter: (a: ChangeRequest, b: ChangeRequest) =>
        dayjs(a.requestDate).unix() - dayjs(b.requestDate).unix(),
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: ChangeRequest) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/change-requests/${record.id}`)}
            >
              {canActOnCR(record) ? 'Take Action' : 'View'}
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card style={{ backgroundColor: '#1890ff', height: '80px', padding: '12px' }}>
            <Statistic 
              title={<span style={{ color: 'white', fontSize: '13px' }}>Total CRs</span>} 
              value={stats.total}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ backgroundColor: '#faad14', height: '80px', padding: '12px' }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: '13px' }}>In Progress</span>}
              value={stats.pending}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ backgroundColor: '#52c41a', height: '80px', padding: '12px' }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: '13px' }}>Completed</span>}
              value={stats.completed}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
              prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ backgroundColor: '#ff4d4f', height: '80px', padding: '12px' }}>
            <Statistic
              title={<span style={{ color: 'white', fontSize: '13px' }}>Rejected</span>}
              value={stats.rejected}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
              prefix={<CloseCircleOutlined style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card
            hoverable
            onClick={() => setShowMyActions(!showMyActions)}
            style={{ 
              cursor: 'pointer', 
              backgroundColor: showMyActions ? '#722ed1' : '#9254de',
              height: '80px',
              padding: '12px'
            }}
          >
            <Statistic
              title={<span style={{ color: 'white', fontSize: '13px' }}>My Actions</span>}
              value={stats.myActions}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 600 }}
              prefix={<Badge status="processing" style={{ color: 'white' }} />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ backgroundColor: '#f0f0f0', height: '80px', padding: '12px' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              block
              onClick={() => navigate('/change-requests/create')}
              style={{ marginTop: '8px' }}
            >
              New CR
            </Button>
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="Search CR number, purpose, or description..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 350 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 200 }}
              placeholder="Filter by Status"
            >
              <Option value="all">All Status</Option>
              <Option value="Pending LM Approval">Pending LM Approval</Option>
              <Option value="Pending HoIT Approval">Pending HoIT Approval</Option>
              <Option value="IT Officer Assessment">IT Officer Assessment</Option>
              <Option value="Requestor Test Confirmation Required">Test Confirmation Required</Option>
              <Option value="Pending QA Validation">Pending QA Validation</Option>
              <Option value="Pending Production Approval">Pending Production Approval</Option>
              <Option value="Pending Final Approval">Pending Final Approval</Option>
              <Option value="Ready to Deploy">Ready to Deploy</Option>
              <Option value="Waiting for Closure">Waiting for Closure</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Rejected">Rejected</Option>
            </Select>
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: 150 }}
              placeholder="Filter by Priority"
            >
              <Option value="all">All Priority</Option>
              {CR_PRIORITIES.map((p) => (
                <Option key={p} value={p}>
                  {p}
                </Option>
              ))}
            </Select>
            <Select
              value={stageFilter}
              onChange={setStageFilter}
              style={{ width: 180 }}
              placeholder="Filter by Stage"
            >
              <Option value="all">All Stages</Option>
              {CR_STAGES.map((s) => (
                <Option key={s.stage} value={s.stage}>
                  Stage {s.stage}: {s.name}
                </Option>
              ))}
            </Select>
          </Space>
          <Space>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setStageFilter('all');
                setShowMyActions(false);
              }}
            >
              Clear Filters
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadChangeRequests} loading={loading}>
              Refresh
            </Button>
          </Space>
        </Space>

        {showMyActions && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="orange" closable onClose={() => setShowMyActions(false)}>
              Showing CRs requiring my action ({stats.myActions})
            </Tag>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={filteredCRs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1400 }}
          rowClassName={(record) => (canActOnCR(record) ? 'action-required-row' : '')}
        />
      </Card>

      <style>
        {`
          .action-required-row {
            background-color: #fffbe6;
          }
          .action-required-row:hover td {
            background-color: #fff1b8 !important;
          }
        `}
      </style>
    </div>
  );
};

export default ChangeRequestListEnhanced;
