import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  message,
  Upload,
  Image,
  Alert,
  Card,
  Select,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { ChangeRequest } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import authService from '../../../services/auth.service';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Props {
  cr: ChangeRequest;
  onSuccess: () => void;
}

const NOCClosureForm: React.FC<Props> = ({ cr, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [incidentTriggered, setIncidentTriggered] = useState<boolean | null>(null);
  const [rollbackTriggered, setRollbackTriggered] = useState<boolean | null>(null);
  const [hoursElapsed, setHoursElapsed] = useState(0);
  const [requiresJustification, setRequiresJustification] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadSavedSignature();
    calculateTimeElapsed();
  }, []);

  const loadSavedSignature = () => {
    const savedSignature = localStorage.getItem(`user_signature_${currentUser?.id}`);
    if (savedSignature) {
      setSignatureFile(savedSignature);
      setSignaturePreview(savedSignature);
    }
  };

  const calculateTimeElapsed = () => {
    // Calculate hours since deployment completion (status changed to "Waiting for Closure")
    // For this demo, we'll use updatedAt as the deployment completion time
    const deploymentTime = dayjs(cr.updatedAt);
    const now = dayjs();
    const hours = now.diff(deploymentTime, 'hour');
    setHoursElapsed(hours);
    setRequiresJustification(hours < 48);
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

    if (incidentTriggered === null) {
      message.error('Please indicate if any incident was triggered');
      return;
    }

    if (rollbackTriggered === null) {
      message.error('Please indicate if rollback was triggered');
      return;
    }

    if (incidentTriggered && !values.incidentDetails?.trim()) {
      message.error('Please provide incident details');
      return;
    }

    if (rollbackTriggered && !values.rollbackDetails?.trim()) {
      message.error('Please provide rollback details');
      return;
    }

    if (requiresJustification && !values.earlyClosureJustification?.trim()) {
      message.error('Please provide justification for early closure');
      return;
    }

    if (!values.nocClosureNotes?.trim()) {
      message.error('Please provide NOC closure notes');
      return;
    }

    setLoading(true);
    try {
      const closureData = {
        nocClosureNotes: values.nocClosureNotes,
        incidentTriggered: incidentTriggered,
        incidentDetails: incidentTriggered ? values.incidentDetails : null,
        rollbackTriggered: rollbackTriggered,
        rollbackDetails: rollbackTriggered ? values.rollbackDetails : null,
        nocClosureJustification: requiresJustification ? values.earlyClosureJustification : null,
        signatureFilePath: signatureFile,
      };

      await changeRequestService.closeCR(cr.id, closureData);

      message.success('CR closed successfully! All stakeholders have been notified.');
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
        message="NOC Closure"
        description="Close the change request after the 48-hour monitoring period. Document any incidents or rollbacks that occurred."
        type="info"
        showIcon
        icon={<ClockCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Card title="Monitoring Period Status" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Hours Since Deployment"
              value={hoursElapsed}
              suffix="hours"
              valueStyle={{ color: hoursElapsed >= 48 ? '#3f8600' : '#faad14' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Required Wait Time"
              value={48}
              suffix="hours"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Status"
              value={hoursElapsed >= 48 ? 'Ready to Close' : 'Early Closure'}
              valueStyle={{ color: hoursElapsed >= 48 ? '#3f8600' : '#faad14' }}
            />
          </Col>
        </Row>
      </Card>

      {requiresJustification && (
        <Alert
          message="Early Closure Warning"
          description="Less than 48 hours have passed since deployment. You must provide justification for early closure."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {requiresJustification && (
          <Form.Item
            name="earlyClosureJustification"
            label="Early Closure Justification (Required)"
            rules={[{ required: true, message: 'Justification is required for early closure' }]}
          >
            <TextArea
              placeholder="Explain why the CR is being closed before the 48-hour monitoring period..."
              rows={4}
              maxLength={1000}
              showCount
            />
          </Form.Item>
        )}

        <Card title="Incident Information" style={{ marginBottom: 16 }}>
          <Form.Item label="Incident Triggered" required>
            <Select
              placeholder="Select"
              value={incidentTriggered}
              onChange={(value) => setIncidentTriggered(value)}
              style={{ width: 200 }}
            >
              <Option value={true}>YES</Option>
              <Option value={false}>NO</Option>
            </Select>
          </Form.Item>

          {incidentTriggered && (
            <Form.Item
              name="incidentDetails"
              label="Incident Details (Required)"
              rules={[{ required: true, message: 'Please provide incident details' }]}
            >
              <TextArea
                placeholder="Provide details about the incident triggered by this change..."
                rows={4}
                maxLength={1000}
                showCount
              />
            </Form.Item>
          )}
        </Card>

        <Card title="Rollback Information" style={{ marginBottom: 16 }}>
          <Form.Item label="Rollback Triggered" required>
            <Select
              placeholder="Select"
              value={rollbackTriggered}
              onChange={(value) => setRollbackTriggered(value)}
              style={{ width: 200 }}
            >
              <Option value={true}>YES</Option>
              <Option value={false}>NO</Option>
            </Select>
          </Form.Item>

          {rollbackTriggered && (
            <Form.Item
              name="rollbackDetails"
              label="Rollback Details (Required)"
              rules={[{ required: true, message: 'Please provide rollback details' }]}
            >
              <TextArea
                placeholder="Provide details about the rollback process and reasons..."
                rows={4}
                maxLength={1000}
                showCount
              />
            </Form.Item>
          )}
        </Card>

        <Form.Item
          name="nocClosureNotes"
          label="NOC Closure Notes"
          rules={[{ required: true, message: 'Please provide closure notes' }]}
        >
          <TextArea
            placeholder="Document the closure of this CR including:
- Overall status of the change
- Any observations during the monitoring period
- Confirmation that the change is stable
- Any follow-up actions required"
            rows={6}
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Card title="NOC Officer Signature" style={{ marginBottom: 16 }}>
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
            Close Change Request
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default NOCClosureForm;
