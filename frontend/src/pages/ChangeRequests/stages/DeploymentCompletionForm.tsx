import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, message, Upload, Image, Alert, Card } from 'antd';
import { UploadOutlined, DeleteOutlined, RocketOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ChangeRequest } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import authService from '../../../services/auth.service';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface Props {
  cr: ChangeRequest;
  onSuccess: () => void;
}

const DeploymentCompletionForm: React.FC<Props> = ({ cr, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
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

    if (!values.deploymentNotes?.trim()) {
      message.error('Please provide deployment notes');
      return;
    }

    setLoading(true);
    try {
      // Mark deployment as complete and move to NOC closure
      await changeRequestService.approve(cr.id, {
        signatureFilePath: signatureFile,
        comments: values.deploymentNotes,
      });

      message.success('Deployment completed! CR sent to NOC for closure. All stakeholders have been notified.');
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
        message="Deployment Completion"
        description="Confirm that the deployment has been completed successfully in production. The CR will then move to NOC for the 48-hour monitoring period."
        type="info"
        showIcon
        icon={<RocketOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Card title="Deployment Details" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <strong>Planned Deployment:</strong>{' '}
          {cr.plannedDatetime ? dayjs(cr.plannedDatetime).format('YYYY-MM-DD HH:mm') : 'N/A'}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Expected Downtime:</strong> {cr.expectedDowntimeValue} {cr.expectedDowntimeUnit}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Category:</strong> {cr.category} / {cr.subcategory}
        </div>
      </Card>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="deploymentNotes"
          label="Deployment Notes"
          rules={[{ required: true, message: 'Please provide deployment notes' }]}
          extra="Document what was deployed, any issues encountered, and confirmation of successful completion"
        >
          <TextArea
            placeholder="Document the deployment process, including:
- What was deployed
- Any issues encountered during deployment
- Steps taken to resolve issues (if any)
- Confirmation that all changes are working as expected
- Any post-deployment observations"
            rows={8}
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="actualDowntime"
          label="Actual Downtime (Optional)"
        >
          <Input placeholder="e.g., 15 minutes, 2 hours, etc." />
        </Form.Item>

        <Card title="Deployment Team Confirmation" style={{ marginBottom: 16 }}>
          <Alert
            message="Important"
            description="By signing below, you confirm that the deployment has been completed successfully and the system is operational."
            type="warning"
            showIcon
          />

          <Form.Item
            label="Your Signature"
            required
            extra="Upload JPG or PNG file (max 2MB). Your signature will be saved for future use."
            style={{ marginTop: 16 }}
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
                  <Upload
                    beforeUpload={handleSignatureUpload}
                    showUploadList={false}
                    accept=".jpg,.jpeg,.png"
                  >
                    <Button icon={<UploadOutlined />}>Replace Signature</Button>
                  </Upload>
                  <Button icon={<DeleteOutlined />} danger onClick={removeSignature}>
                    Remove
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
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<CheckCircleOutlined />}
          >
            Mark Deployment as Completed
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default DeploymentCompletionForm;
