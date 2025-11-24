import React from 'react';
import { Card, Table, Tag, Image, Typography, Space, Alert, Divider, Row, Col, Timeline } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { CRApproval } from '../../../types/change-request.types';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface Props {
  approvals: CRApproval[];
}

const STAGE_NAMES: { [key: number]: string } = {
  1: 'CR Submission',
  2: 'Line Manager Approval',
  3: 'Head of IT Initial Approval',
  4: 'IT Officer Assessment',
  5: 'Requestor Test Confirmation',
  6: 'QA Officer Validation',
  7: 'Head of IT Production Approval',
  8: 'Head of InfoSec Approval',
  9: 'Deployment Completion',
  10: 'NOC Closure',
};

const ROLE_LABELS: { [key: string]: string } = {
  requestor: 'Requestor',
  line_manager: 'Line Manager',
  head_of_it: 'Head of IT',
  it_officer: 'IT Officer',
  qa_officer: 'QA Officer',
  head_of_infosec: 'Head of InfoSec',
  noc: 'NOC Officer',
};

const ApprovalHistoryView: React.FC<Props> = ({ approvals }) => {
  if (!approvals || approvals.length === 0) {
    return (
      <Alert
        message="No Approvals Yet"
        description="No approval actions have been recorded for this change request."
        type="info"
        showIcon
      />
    );
  }

  // Sort approvals by date
  const sortedApprovals = [...approvals].sort(
    (a, b) => new Date(a.approvedAt || 0).getTime() - new Date(b.approvedAt || 0).getTime()
  );

  const columns = [
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      width: '20%',
      render: (stage: number) => (
        <Space direction="vertical" size={0}>
          <Text strong>Stage {stage}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {STAGE_NAMES[stage] || `Stage ${stage}`}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Approver',
      key: 'approver',
      width: '25%',
      render: (record: CRApproval) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            <UserOutlined style={{ marginRight: 4 }} />
            {record.approver
              ? `${record.approver.firstName} ${record.approver.lastName}`
              : `User ID: ${record.approverId}`}
          </Text>
          <Tag color="blue">{ROLE_LABELS[record.approverRole] || record.approverRole}</Tag>
        </Space>
      ),
    },
    {
      title: 'Decision',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status: string) => (
        <Tag
          color={status === 'approved' ? 'green' : 'red'}
          icon={status === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{ fontSize: 14, padding: '4px 12px' }}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'approvedAt',
      key: 'approvedAt',
      width: '20%',
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <Text>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {dayjs(date).format('DD/MM/YYYY')}
          </Text>
          <Text type="secondary">{dayjs(date).format('HH:mm:ss')}</Text>
        </Space>
      ),
    },
    {
      title: 'Signature',
      dataIndex: 'signatureFilePath',
      key: 'signature',
      width: '20%',
      render: (signaturePath: string) =>
        signaturePath ? (
          <div
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: 8,
              background: '#fafafa',
              textAlign: 'center',
            }}
          >
            <Image
              src={signaturePath}
              alt="Signature"
              style={{ maxHeight: 60, maxWidth: 150 }}
              preview={{
                mask: 'View Signature',
              }}
            />
          </div>
        ) : (
          <Text type="secondary">No signature</Text>
        ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            <span>Approval History</span>
            <Tag color="blue">{approvals.length} Approvals</Tag>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          dataSource={sortedApprovals}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          bordered
        />
      </Card>

      {/* Comments Section */}
      {sortedApprovals.some((a) => a.comments) && (
        <Card title="Approval Comments" style={{ marginBottom: 16 }}>
          <Timeline mode="left">
            {sortedApprovals
              .filter((approval) => approval.comments)
              .map((approval) => (
                <Timeline.Item
                  key={approval.id}
                  color={approval.status === 'approved' ? 'green' : 'red'}
                  label={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(approval.approvedAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  }
                >
                  <Card size="small" style={{ marginBottom: 0 }}>
                    <Space direction="vertical" size={4}>
                      <Space>
                        <Tag color="blue">{STAGE_NAMES[approval.stage]}</Tag>
                        <Text strong>
                          {approval.approver
                            ? `${approval.approver.firstName} ${approval.approver.lastName}`
                            : ROLE_LABELS[approval.approverRole]}
                        </Text>
                      </Space>
                      <Text>{approval.comments}</Text>
                    </Space>
                  </Card>
                </Timeline.Item>
              ))}
          </Timeline>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card title="Approval Summary" size="small">
        <Row gutter={16} justify="center">
          <Col span={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
              {approvals.filter((a) => a.status === 'approved').length}
            </div>
            <div style={{ color: '#8c8c8c' }}>Approved</div>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
              {approvals.filter((a) => a.status === 'rejected').length}
            </div>
            <div style={{ color: '#8c8c8c' }}>Rejected</div>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
              {approvals.length}
            </div>
            <div style={{ color: '#8c8c8c' }}>Total Actions</div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ApprovalHistoryView;
