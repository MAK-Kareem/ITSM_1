import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Upload, Image, Radio, Alert } from 'antd';
import { UploadOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { ChangeRequest } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import authService from '../../../services/auth.service';

const { TextArea } = Input;

interface Props {
  cr: ChangeRequest;
  onSuccess: () => void;
}

const LineManagerApprovalForm: React.FC<Props> = ({ cr, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadSavedSignature();
  }, []);

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

    if (decision === 'reject' && !values.comments?.trim()) {
      message.error('Please provide rejection reason');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        signatureFilePath: signatureFile,
        comments: values.comments || '',
      };

      if (decision === 'approve') {
        await changeRequestService.approve(cr.id, payload);
        message.success('CR approved for UAT! Sent to Head of IT for review.');
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
        message="Line Manager Review"
        description="Please review the change request details and approve or reject for UAT testing. Your approval indicates that the business need is justified."
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
              <CheckOutlined /> Approve for UAT
            </Radio.Button>
            <Radio.Button value="reject">
              <CloseOutlined /> Reject
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

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
                : 'Add any comments or observations...'
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
            {decision === 'approve' ? 'Approve CR for UAT' : decision === 'reject' ? 'Reject CR' : 'Submit'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LineManagerApprovalForm;
