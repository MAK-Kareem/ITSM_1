import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Upload, Image, Radio, Alert, Select } from 'antd';
import { UploadOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { ChangeRequest } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import userService from '../../../services/user.service';
import authService from '../../../services/auth.service';
import { User } from '../../../types';

const { TextArea } = Input;
const { Option } = Select;

interface Props {
  cr: ChangeRequest;
  onSuccess: () => void;
}

const HeadOfITApprovalForm: React.FC<Props> = ({ cr, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [itOfficers, setITOfficers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadSavedSignature();
    loadITOfficers();
  }, []);

  const loadSavedSignature = () => {
    const savedSignature = localStorage.getItem(`user_signature_${currentUser?.id}`);
    if (savedSignature) {
      setSignatureFile(savedSignature);
      setSignaturePreview(savedSignature);
    }
  };

  const loadITOfficers = async () => {
    setLoadingUsers(true);
    try {
      const users = await userService.getAll();
      // Filter for IT Officers - adjust role name as per your system
      const officers = users.filter((u: any) => u.role === 'it_officer' || u.department?.toUpperCase().includes('ITOFFICER'));
      setITOfficers(officers);
    } catch (error) {
      message.error('Failed to load IT Officers');
    } finally {
      setLoadingUsers(false);
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
      message.success('Signature uploaded and saved');
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

    if (!decision) {
      message.error('Please select your decision (Approve or Reject)');
      return;
    }

    if (decision === 'approve' && !values.assignedToITOfficerId) {
      message.error('Please assign an IT Officer');
      return;
    }

    if (decision === 'reject' && !values.comments?.trim()) {
      message.error('Please provide rejection reason');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        signatureFilePath: signatureFile,
        comments: values.comments || '',
        assignedToITOfficerId: values.assignedToITOfficerId,
      };

      if (decision === 'approve') {
        await changeRequestService.approve(cr.id, payload);
        message.success('CR approved! Assigned to IT Officer for assessment.');
      } else {
        await changeRequestService.reject(cr.id, { reason: values.comments, ...payload });
        message.success('CR has been rejected.');
      }

      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert
        message="Head of IT Departmental Approval"
        description="Review the CR and provide departmental approval for UAT. Upon approval, assign an IT Officer to handle the technical assessment and testing."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Your Decision" required>
          <Radio.Group
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="approve" style={{ marginRight: 16 }}>
              <CheckOutlined /> Approve UAT
            </Radio.Button>
            <Radio.Button value="reject">
              <CloseOutlined /> Reject
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {decision === 'approve' && (
          <Form.Item
            name="assignedToITOfficerId"
            label="Assign to IT Officer"
            rules={[{ required: true, message: 'Please select an IT Officer' }]}
          >
            <Select
              placeholder="Select IT Officer to assign"
              loading={loadingUsers}
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {itOfficers.map((officer) => (
                <Option key={officer.id} value={officer.id}>
                  {officer.firstName} {officer.lastName} ({officer.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="comments"
          label={decision === 'reject' ? 'Rejection Reason (Required)' : 'Comments (Optional)'}
          rules={
            decision === 'reject'
              ? [{ required: true, message: 'Please provide rejection reason' }]
              : []
          }
        >
          <TextArea
            placeholder={
              decision === 'reject'
                ? 'Please explain why this CR is being rejected...'
                : 'Add any comments or special instructions for the IT Officer...'
            }
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Your Signature"
          required
          extra="Upload JPG or PNG file (max 2MB). Your signature will be saved for future use."
        >
          {signaturePreview ? (
            <div>
              <div
                style={{
                  border: '1px solid #d9d9d9',
                  padding: '16px',
                  borderRadius: '4px',
                  background: '#fafafa',
                  marginBottom: 8,
                }}
              >
                <Image
                  src={signaturePreview}
                  alt="Your Signature"
                  style={{ maxHeight: '100px', maxWidth: '300px' }}
                  preview={false}
                />
              </div>
              <Space>
                <Upload beforeUpload={handleSignatureUpload} showUploadList={false} accept=".jpg,.jpeg,.png">
                  <Button icon={<UploadOutlined />}>Replace Signature</Button>
                </Upload>
                <Button icon={<DeleteOutlined />} danger onClick={removeSignature}>
                  Remove
                </Button>
              </Space>
            </div>
          ) : (
            <Upload beforeUpload={handleSignatureUpload} showUploadList={false} accept=".jpg,.jpeg,.png">
              <Button icon={<UploadOutlined />} size="large">
                Upload Signature Image
              </Button>
            </Upload>
          )}
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            disabled={!decision}
            danger={decision === 'reject'}
          >
            {decision === 'approve'
              ? 'Approve & Assign to IT Officer'
              : decision === 'reject'
              ? 'Reject CR'
              : 'Submit'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default HeadOfITApprovalForm;
