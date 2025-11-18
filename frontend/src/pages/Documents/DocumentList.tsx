import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Upload, Modal, Form, message, Select } from 'antd';
import { UploadOutlined, SearchOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // API call would go here
      setDocuments([]);
    } catch (error) {
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getAccessColor = (access: string) => {
    const colors: Record<string, string> = {
      Public: 'green',
      Private: 'orange',
      Restricted: 'red',
    };
    return colors[access] || 'default';
  };

  const columns = [
    {
      title: 'Document Name',
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
      title: 'Access Level',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      render: (access: string) => <Tag color={getAccessColor(access)}>{access}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>,
    },
    {
      title: 'Uploaded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<DownloadOutlined />}>
            Download
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1>Document Management</h1>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => setModalVisible(true)}>
          Upload Document
        </Button>
      </Space>

      <Input
        placeholder="Search documents..."
        prefix={<SearchOutlined />}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, width: 300 }}
      />

      <Table columns={columns} dataSource={documents} rowKey="id" loading={loading} />

      <Modal
        title="Upload Document"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Document Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Policy">Policy</Select.Option>
              <Select.Option value="Procedure">Procedure</Select.Option>
              <Select.Option value="Manual">Manual</Select.Option>
              <Select.Option value="Guide">Guide</Select.Option>
              <Select.Option value="Report">Report</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="accessLevel" label="Access Level" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Public">Public</Select.Option>
              <Select.Option value="Private">Private</Select.Option>
              <Select.Option value="Restricted">Restricted</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="file" label="File" rules={[{ required: true }]}>
            <Upload maxCount={1}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Upload
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentList;
