import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Card, Row, Col, Progress } from 'antd';
import { WarningOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const AlertList: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'blue',
    };
    return colors[severity] || 'default';
  };

  const columns = [
    {
      title: 'Alert ID',
      dataIndex: 'alertId',
      key: 'alertId',
    },
    {
      title: 'Alert Type',
      dataIndex: 'alertType',
      key: 'alertType',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => <Tag color={getSeverityColor(severity)}>{severity.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'resolved' ? 'green' : status === 'acknowledged' ? 'blue' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Triggered',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'active' && (
            <Button type="link" size="small">Acknowledge</Button>
          )}
          {record.status === 'acknowledged' && (
            <Button type="link" size="small">Resolve</Button>
          )}
          <Button type="link" size="small">View</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>NOC Monitoring - System Alerts</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Progress type="dashboard" percent={98} strokeColor="#52c41a" />
              <div style={{ marginTop: 16, fontSize: 16, fontWeight: 'bold' }}>System Health</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <WarningOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <div style={{ marginTop: 16, fontSize: 24, fontWeight: 'bold' }}>5</div>
              <div>Active Alerts</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <div style={{ marginTop: 16, fontSize: 24, fontWeight: 'bold' }}>12</div>
              <div>Resolved Today</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CloseCircleOutlined style={{ fontSize: 48, color: '#f5222d' }} />
              <div style={{ marginTop: 16, fontSize: 24, fontWeight: 'bold' }}>2</div>
              <div>Critical</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search alerts..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select placeholder="Severity" style={{ width: 150 }}>
          <Select.Option value="all">All Severity</Select.Option>
          <Select.Option value="critical">Critical</Select.Option>
          <Select.Option value="high">High</Select.Option>
          <Select.Option value="medium">Medium</Select.Option>
          <Select.Option value="low">Low</Select.Option>
        </Select>
        <Select placeholder="Status" style={{ width: 150 }}>
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="acknowledged">Acknowledged</Select.Option>
          <Select.Option value="resolved">Resolved</Select.Option>
        </Select>
      </Space>

      <Table columns={columns} dataSource={alerts} rowKey="id" loading={loading} />
    </div>
  );
};

export default AlertList;
