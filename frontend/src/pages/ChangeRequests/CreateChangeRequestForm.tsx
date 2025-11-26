import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Card, Row, Col, Space, Alert, Upload, Image } from 'antd';
import { SaveOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import changeRequestService from '../../services/change-request.service';
import userService from '../../services/user.service';
import authService from '../../services/auth.service';
import { User } from '../../types';
import { CR_PRIORITIES } from '../../types/change-request.types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const CreateChangeRequestForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadUsers();
    loadSavedSignature();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const userList = await userService.getAll();
      setUsers(userList);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSavedSignature = () => {
    const savedSignature = localStorage.getItem(`user_signature_${currentUser?.id}`);
    if (savedSignature) {
      setSignatureFile(savedSignature);
      setSignaturePreview(savedSignature);
    }
  };

  const handleSignatureUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      message.error('Signature file must not exceed 2MB');
      return false;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      message.error('Only JPG or PNG files are allowed');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSignatureFile(base64);
      setSignaturePreview(base64);
      localStorage.setItem(`user_signature_${currentUser?.id}`, base64);
      message.success('Signature uploaded and saved for future use');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const removeSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    localStorage.removeItem(`user_signature_${currentUser?.id}`);
    message.info('Signature removed');
  };

  const handleSubmit = async (values: any) => {
    if (!signatureFile) {
      message.error('Please upload your signature');
      return;
    }

    if (values.businessPriority === 'High' && !values.priorityJustification) {
      message.error('Priority justification is required for High priority');
      return;
    }

    setLoading(true);
    try {
      const formData = {
        purposeOfChange: values.purposeOfChange,
        descriptionOfChange: values.descriptionOfChange,
        lineManagerId: values.lineManagerId,
        businessPriority: values.businessPriority,
        priorityJustification: values.priorityJustification || null,
        requestorSignature: signatureFile,
      };

      await changeRequestService.create(formData);
      message.success('Change Request created successfully! Sent to Line Manager for approval.');
      navigate('/change-requests');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create change request');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value);
    if (value !== 'High') {
      form.setFieldsValue({ priorityJustification: null });
    }
  };

  // Custom component for highlighted section headers
  const FormSectionHeader = ({ title }: { title: string }) => (
    <div style={{ 
      backgroundColor: '#f0f5ff', 
      padding: '10px 16px', 
      marginBottom: '24px', 
      marginTop: '24px',
      borderLeft: '4px solid #1890ff', 
      borderRadius: '2px',
      color: '#003a8c', 
      fontWeight: 600,
      fontSize: '15px'
    }}>
      {title}
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Create Change Request</span>
            <span style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}> | Stage 1: Request Submission</span>
          </Space>
        }
        headStyle={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e8e8e8' }}
        bordered={false}
        style={{ boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)' }}
      >
        <Alert
          message="Important"
          description="Once submitted, this CR will be sent to your Line Manager for UAT approval."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Requested By">
                <Input
                  value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Loading...'}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', color: '#595959' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Request Date">
                <Input 
                  value={dayjs().format('YYYY-MM-DD HH:mm')} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5', color: '#595959' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <FormSectionHeader title="Change Details" />

          <Form.Item
            name="purposeOfChange"
            label="Purpose of Change"
            rules={[{ required: true, message: 'Please enter the purpose of change' }]}
          >
            <TextArea placeholder="Describe WHY this change is needed" rows={4} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item
            name="descriptionOfChange"
            label="Description of Change"
            rules={[{ required: true, message: 'Please enter the description' }]}
          >
            <TextArea placeholder="Describe WHAT will be changed" rows={6} maxLength={2000} showCount />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lineManagerId"
                label="Line Manager"
                rules={[{ required: true, message: 'Please select Line Manager' }]}
              >
                <Select
                  placeholder="Select Line Manager"
                  showSearch
                  loading={loadingUsers}
                  filterOption={(input, option) =>
                    (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="businessPriority"
                label="Business Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority" onChange={handlePriorityChange}>
                  {CR_PRIORITIES.map(priority => (
                    <Option key={priority} value={priority}>{priority}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {selectedPriority === 'High' && (
            <Form.Item
              name="priorityJustification"
              label="Priority Justification (Required for High Priority)"
              rules={[{ required: true, message: 'Justification required' }]}
            >
              <TextArea placeholder="Explain why High priority is needed" rows={3} maxLength={500} showCount />
            </Form.Item>
          )}

          <FormSectionHeader title="Requestor Signature" />

          <Form.Item
            label="Your Signature"
            required
            extra="Upload JPG or PNG file (max 2MB). Your signature will be saved for future requests."
          >
            {signaturePreview ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ border: '1px solid #d9d9d9', padding: '16px', borderRadius: '4px', background: '#fafafa', marginBottom: 8 }}>
                  <Image
                    src={signaturePreview}
                    alt="Your Signature"
                    style={{ maxHeight: '100px', maxWidth: '300px' }}
                    preview={false}
                  />
                </div>
                <Space>
                  <Upload
                    beforeUpload={handleSignatureUpload}
                    showUploadList={false}
                    accept=".jpg,.jpeg,.png"
                  >
                    <Button icon={<UploadOutlined />}>Replace Signature</Button>
                  </Upload>
                  <Button icon={<DeleteOutlined />} danger onClick={removeSignature}>
                    Remove Signature
                  </Button>
                </Space>
              </div>
            ) : (
              <Upload
                beforeUpload={handleSignatureUpload}
                showUploadList={false}
                accept=".jpg,.jpeg,.png"
              >
                <Button icon={<UploadOutlined />} size="large">
                  Upload Signature Image
                </Button>
              </Upload>
            )}
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large">
                Submit Change Request
              </Button>
              <Button onClick={() => navigate('/change-requests')} size="large">Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateChangeRequestForm;