import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const PolicyList: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default',
      active: 'green',
      review: 'orange',
      archived: 'red',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Policy Number',
      dataIndex: 'policyNumber',
      key: 'policyNumber',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Effective Date',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : 'N/A',
    },
    {
      title: 'Review Date',
      dataIndex: 'reviewDate',
      key: 'reviewDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<FileTextOutlined />} size="small">
            View
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small">Approve</Button>
          )}
          <Button type="link" size="small">Edit</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1>Policy Management</h1>
        <Button type="primary" icon={<PlusOutlined />}>
          Create Policy
        </Button>
      </Space>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search policies..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select placeholder="Category" style={{ width: 150 }}>
          <Select.Option value="all">All Categories</Select.Option>
          <Select.Option value="IT">IT</Select.Option>
          <Select.Option value="Security">Security</Select.Option>
          <Select.Option value="HR">HR</Select.Option>
          <Select.Option value="Finance">Finance</Select.Option>
          <Select.Option value="Compliance">Compliance</Select.Option>
        </Select>
        <Select placeholder="Status" style={{ width: 150 }}>
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="draft">Draft</Select.Option>
          <Select.Option value="active">Active</Select.Option>
          <Select.Option value="review">Under Review</Select.Option>
          <Select.Option value="archived">Archived</Select.Option>
        </Select>
      </Space>

      <Table columns={columns} dataSource={policies} rowKey="id" loading={loading} />
    </div>
  );
};

export default PolicyList;
