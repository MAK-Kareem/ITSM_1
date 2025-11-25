import React, { useState } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, message, Card, Row, Col, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import changeRequestService from '../../services/change-request.service';
import authService from '../../services/auth.service';

const ChangeRequestForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        requestedBy: currentUser?.id,
        requestDate: new Date().toISOString(),
        plannedDatetime: values.plannedDatetime ? values.plannedDatetime.toISOString() : null,
        lastBackupDate: values.lastBackupDate ? values.lastBackupDate.toISOString() : null,
        currentStage: 1,
        currentStatus: 'pending',
      };

      await changeRequestService.create(formattedValues);
      message.success('Change request created successfully');
      navigate('/change-requests');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create change request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Create Change Request</h1>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="purposeOfChange"
                label="Purpose of Change"
                rules={[{ required: true, message: 'Please enter purpose of change' }]}
              >
                <Input.TextArea placeholder="Describe the purpose of this change..." rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="descriptionOfChange"
                label="Description of Change"
                rules={[{ required: true, message: 'Please enter description' }]}
              >
                <Input.TextArea placeholder="Provide detailed description of the change..." rows={5} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="businessPriority"
                label="Business Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Select.Option value="Low">Low</Select.Option>
                  <Select.Option value="Medium">Medium</Select.Option>
                  <Select.Option value="High">High</Select.Option>
                  <Select.Option value="Critical">Critical</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lineManagerId"
                label="Line Manager"
                rules={[{ required: true, message: 'Please select line manager' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="Line Manager ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Select placeholder="Select category">
                  <Select.Option value="Infrastructure">Infrastructure</Select.Option>
                  <Select.Option value="Application">Application</Select.Option>
                  <Select.Option value="Database">Database</Select.Option>
                  <Select.Option value="Network">Network</Select.Option>
                  <Select.Option value="Security">Security</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="impactsClientService" label="Impacts Client Service">
                <Select placeholder="Select impact">
                  <Select.Option value={true}>Yes</Select.Option>
                  <Select.Option value={false}>No</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit Change Request
              </Button>
              <Button onClick={() => navigate('/change-requests')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangeRequestForm;
