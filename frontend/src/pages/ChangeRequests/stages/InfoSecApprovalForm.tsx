import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Upload, Image, Radio, Alert, Descriptions, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { ChangeRequest, CR_PRIORITY_COLORS } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import authService from '../../../services/auth.service';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Props {
  cr: ChangeRequest;
  onSuccess: () => void;
}

const InfoSecApprovalForm: React.FC<Props> = ({ cr, onSuccess }) => {
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
        comments: values.comments || 'Final approval granted for deployment',
      };

      if (decision === 'approve') {
        await changeRequestService.approve(cr.id, payload);
        message.success('Final approval granted! CR is now Ready to Deploy. NOC and all stakeholders have been notified.');
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
        message="Head of Information Security - Final Approval"
        description="Review the complete CR form including all signatures and checklists. Your approval authorizes the deployment team to proceed with production deployment."
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Alert
        message="Security Review Summary"
        description={
          <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
            <Descriptions.Item label="Category">{cr.category || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Impacts Client Service">
              <Tag color={cr.impactsClientService ? 'red' : 'green'}>
                {cr.impactsClientService ? 'YES' : 'NO'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={CR_PRIORITY_COLORS[cr.businessPriority] || 'default'}>
                {cr.businessPriority}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Expected Downtime">
              {cr.expectedDowntimeValue} {cr.expectedDowntimeUnit}
            </Descriptions.Item>
            <Descriptions.Item label="Planned Deployment">
              {cr.plannedDatetime ? dayjs(cr.plannedDatetime).format('YYYY-MM-DD HH:mm') : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        }
        type="warning"
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
              <CheckOutlined /> Grant Final Approval
            </Radio.Button>
            <Radio.Button value="reject">
              <CloseOutlined /> Reject
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="comments"
          label={decision === 'reject' ? 'Rejection Reason (Required)' : 'Security Comments (Optional)'}
          rules={
            decision === 'reject'
              ? [{ required: true, message: 'Please provide rejection reason' }]
              : []
          }
        >
          <TextArea
            placeholder={
              decision === 'reject'
                ? 'Please explain the security concerns or reasons for rejection...'
                : 'Add any security-related comments or recommendations...'
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
              ? 'Grant Final Approval for Deployment'
              : decision === 'reject'
              ? 'Reject CR'
              : 'Submit'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default InfoSecApprovalForm;
