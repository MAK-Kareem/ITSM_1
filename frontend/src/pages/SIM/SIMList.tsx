import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Modal, Form, message, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const SIMList: React.FC = () => {
  const [sims, setSims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'green',
      assigned: 'blue',
      suspended: 'orange',
      terminated: 'red',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'SIM Number',
      dataIndex: 'simNumber',
      key: 'simNumber',
    },
    {
      title: 'Mobile Number',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
    },
    {
      title: 'ICCID',
      dataIndex: 'iccid',
      key: 'iccid',
      ellipsis: true,
    },
    {
      title: 'Carrier',
      dataIndex: 'carrier',
      key: 'carrier',
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedToEmployee',
      key: 'assignedToEmployee',
      render: (employee: any) => employee ? `${employee.firstName} ${employee.lastName}` : 'N/A',
    },
    {
      title: 'Monthly Cost',
      dataIndex: 'monthlyCost',
      key: 'monthlyCost',
      render: (cost: number) => cost ? `BHD ${cost.toFixed(2)}` : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'available' && (
            <Button type="link" size="small">Assign</Button>
          )}
          {record.status === 'assigned' && (
            <Button type="link" size="small">Unassign</Button>
          )}
          <Button type="link" size="small">Edit</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1>SIM Card Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Add SIM Card
        </Button>
      </Space>

      <Input
        placeholder="Search SIM cards..."
        prefix={<SearchOutlined />}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, width: 300 }}
      />

      <Table columns={columns} dataSource={sims} rowKey="id" loading={loading} />

      <Modal
        title="Add SIM Card"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="simNumber" label="SIM Number" rules={[{ required: true }]}>
            <Input placeholder="Enter SIM number" />
          </Form.Item>
          <Form.Item name="mobileNumber" label="Mobile Number" rules={[{ required: true }]}>
            <Input placeholder="e.g., +973XXXXXXXX" />
          </Form.Item>
          <Form.Item name="iccid" label="ICCID" rules={[{ required: true }]}>
            <Input placeholder="Enter ICCID" />
          </Form.Item>
          <Form.Item name="carrier" label="Carrier" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Batelco">Batelco</Select.Option>
              <Select.Option value="Zain">Zain</Select.Option>
              <Select.Option value="STC">STC</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="plan" label="Plan">
            <Input placeholder="Plan name" />
          </Form.Item>
          <Form.Item name="monthlyCost" label="Monthly Cost (BHD)">
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Add
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SIMList;
