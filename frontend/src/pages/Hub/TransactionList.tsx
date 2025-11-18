import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, DatePicker, Select, Card, Statistic, Row, Col } from 'antd';
import { SearchOutlined, DollarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    pending: 0,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'success',
      pending: 'processing',
      failed: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
    },
    {
      title: 'Merchant',
      dataIndex: 'merchantId',
      key: 'merchantId',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => `${record.currency} ${amount.toFixed(2)}`,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Button type="link">View Details</Button>
      ),
    },
  ];

  return (
    <div>
      <h1>EazyPay Hub - Payment Transactions</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.total}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Successful"
              value={stats.successful}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Failed"
              value={stats.failed}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search transactions..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <RangePicker />
        <Select placeholder="Status" style={{ width: 150 }}>
          <Select.Option value="all">All</Select.Option>
          <Select.Option value="completed">Completed</Select.Option>
          <Select.Option value="pending">Pending</Select.Option>
          <Select.Option value="failed">Failed</Select.Option>
        </Select>
      </Space>

      <Table columns={columns} dataSource={transactions} rowKey="id" loading={loading} />
    </div>
  );
};

export default TransactionList;
