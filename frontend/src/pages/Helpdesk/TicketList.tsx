import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Rate } from 'antd';
import { PlusOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Ticket } from '../../types';
import ticketService from '../../services/ticket.service';
import dayjs from 'dayjs';

const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.getAll();
      setTickets(data);
    } catch (error) {
      message.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      Low: 'green',
      Medium: 'orange',
      High: 'red',
      Critical: 'volcano',
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Open: 'blue',
      'In Progress': 'processing',
      'Waiting on Customer': 'warning',
      Resolved: 'success',
      Closed: 'default',
    };
    return colors[status] || 'default';
  };

  const handleSubmit = async (values: any) => {
    try {
      await ticketService.create(values);
      message.success('Ticket created successfully');
      setModalVisible(false);
      form.resetFields();
      loadTickets();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = Object.values(ticket).some((value) =>
      String(value).toLowerCase().includes(searchText.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Request Type',
      dataIndex: 'requestType',
      key: 'requestType',
    },
    {
      title: 'Satisfaction',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      render: (rating: number) => rating ? <Rate disabled value={rating} /> : 'N/A',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Ticket) => (
        <Button type="link" icon={<EyeOutlined />}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1>Helpdesk Tickets</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Create Ticket
        </Button>
      </Space>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search tickets..."
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="Open">Open</Select.Option>
          <Select.Option value="In Progress">In Progress</Select.Option>
          <Select.Option value="Resolved">Resolved</Select.Option>
          <Select.Option value="Closed">Closed</Select.Option>
        </Select>
      </Space>

      <Table columns={columns} dataSource={filteredTickets} rowKey="id" loading={loading} />

      <Modal
        title="Create New Ticket"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input placeholder="Brief subject of the ticket" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Detailed description" />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Low">Low</Select.Option>
              <Select.Option value="Medium">Medium</Select.Option>
              <Select.Option value="High">High</Select.Option>
              <Select.Option value="Critical">Critical</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Hardware">Hardware</Select.Option>
              <Select.Option value="Software">Software</Select.Option>
              <Select.Option value="Network">Network</Select.Option>
              <Select.Option value="Access">Access Request</Select.Option>
              <Select.Option value="Account">Account Issue</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="requestType" label="Request Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Service Request">Service Request</Select.Option>
              <Select.Option value="Incident">Incident</Select.Option>
              <Select.Option value="Question">Question</Select.Option>
              <Select.Option value="Complaint">Complaint</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TicketList;
