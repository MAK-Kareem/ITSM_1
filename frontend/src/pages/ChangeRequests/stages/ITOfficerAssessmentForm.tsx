import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  message,
  Upload,
  Image,
  Select,
  InputNumber,
  DatePicker,
  Divider,
  Table,
  Modal,
  Alert,
  Card,
  Row,
  Col,
  Checkbox,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { ChangeRequest, CR_CATEGORIES, CR_DOWNTIME_UNITS } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import authService from '../../../services/auth.service';
import userService from '../../../services/user.service';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Props {
  cr: ChangeRequest;
  onSuccess: () => void;
}

interface DeploymentTeamMember {
  key: string;
  memberId: number | null;
  memberName: string;
  designation: string;
  email: string;
  phone: string;
}

interface TestResult {
  key: string;
  testCase: string;
  expectedResult: string;
  actualResult: string;
  passed: boolean;
  remarks: string;
}

interface UserOption {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
}

const ITOfficerAssessmentForm: React.FC<Props> = ({ cr, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [deploymentTeam, setDeploymentTeam] = useState<DeploymentTeamMember[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [uatDocument, setUatDocument] = useState<File | null>(null);
  const [uatDocumentName, setUatDocumentName] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadSavedSignature();
    loadAvailableUsers();
  }, []);

  const loadSavedSignature = () => {
    const savedSignature = localStorage.getItem(`user_signature_${currentUser?.id}`);
    if (savedSignature) {
      setSignatureFile(savedSignature);
      setSignaturePreview(savedSignature);
    }
  };

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await userService.getAll();
      setAvailableUsers(users);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSubcategories(CR_CATEGORIES[category] || []);
    form.setFieldsValue({ subcategory: undefined });
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

  const handleUATDocumentUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      message.error('UAT document must not exceed 10MB');
      return false;
    }
    setUatDocument(file);
    setUatDocumentName(file.name);
    message.success('UAT document selected');
    return false;
  };

  // Deployment Team Management
  const addDeploymentTeamMember = () => {
    const newMember: DeploymentTeamMember = {
      key: Date.now().toString(),
      memberId: null,
      memberName: '',
      designation: '',
      email: '',
      phone: '',
    };
    setDeploymentTeam([...deploymentTeam, newMember]);
  };

  const removeDeploymentTeamMember = (key: string) => {
    setDeploymentTeam(deploymentTeam.filter((m) => m.key !== key));
  };

  const handleUserSelect = (key: string, userId: number) => {
    const selectedUser = availableUsers.find((u) => u.id === userId);
    if (selectedUser) {
      setDeploymentTeam(
        deploymentTeam.map((m) =>
          m.key === key
            ? {
                ...m,
                memberId: selectedUser.id,
                memberName: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
                designation: selectedUser.department || '',
                email: selectedUser.email,
              }
            : m
        )
      );
    }
  };

  const updateDeploymentTeamMember = (key: string, field: string, value: string) => {
    setDeploymentTeam(
      deploymentTeam.map((m) => (m.key === key ? { ...m, [field]: value } : m))
    );
  };

  // Test Results Management
  const addTestResult = () => {
    const newTest: TestResult = {
      key: Date.now().toString(),
      testCase: '',
      expectedResult: '',
      actualResult: '',
      passed: false,
      remarks: '',
    };
    setTestResults([...testResults, newTest]);
  };

  const removeTestResult = (key: string) => {
    setTestResults(testResults.filter((t) => t.key !== key));
  };

  const updateTestResult = (key: string, field: string, value: any) => {
    setTestResults(testResults.map((t) => (t.key === key ? { ...t, [field]: value } : t)));
  };

  const handleSubmit = async (values: any) => {
    if (!signatureFile) {
      message.error('Please upload your signature');
      return;
    }

    if (deploymentTeam.length === 0) {
      message.error('Please add at least one deployment team member');
      return;
    }

    if (testResults.length === 0) {
      message.error('Please add at least one test result');
      return;
    }

    // Validate deployment team
    const invalidTeamMember = deploymentTeam.find((m) => !m.memberName.trim());
    if (invalidTeamMember) {
      message.error('All deployment team members must have a name');
      return;
    }

    // Validate test results
    const invalidTest = testResults.find(
      (t) => !t.testCase.trim() || !t.expectedResult.trim() || !t.actualResult.trim()
    );
    if (invalidTest) {
      message.error('All test results must have test case, expected result, and actual result');
      return;
    }

    setLoading(true);
    try {
      // Calculate total downtime in minutes
      const totalMinutes = 
        ((values.downtimeDays || 0) * 24 * 60) + 
        ((values.downtimeHours || 0) * 60) + 
        (values.downtimeMinutes || 0);

      // First, update ITO fields
      const itoData = {
        category: values.category,
        subcategory: values.subcategory,
        impactsClientService: values.impactsClientService,
        impactAssessment: values.impactAssessment,
        backoutRollbackPlan: values.backoutRollbackPlan,
        expectedDowntimeValue: totalMinutes,
        expectedDowntimeUnit: 'Minutes',
        costInvolved: values.costInvolved || 0,
        plannedDatetime: values.plannedDatetime?.toISOString(),
        lastBackupDate: values.lastBackupDate?.toISOString(),
      };

      await changeRequestService.updateITOFields(cr.id, itoData);

      // Upload UAT document if provided
      if (uatDocument) {
        const formData = new FormData();
        formData.append('file', uatDocument);
        await changeRequestService.uploadDocument(cr.id, formData);
      }

      // Add deployment team members
      for (const member of deploymentTeam) {
        await changeRequestService.addDeploymentTeamMember(cr.id, {
          memberName: member.memberName,
          designation: member.designation,
          contact: `${member.email}${member.phone ? ' | ' + member.phone : ''}`,
          role: 'member',
        });
      }

      // Add testing results
      const testingData = {
        testType: 'UAT',
        testResults: testResults.map((t) => ({
          testCase: t.testCase,
          expectedResult: t.expectedResult,
          actualResult: t.actualResult,
          passed: t.passed,
          remarks: t.remarks,
        })),
        passed: testResults.every((t) => t.passed),
        notes: values.testingNotes || '',
      };

      await changeRequestService.addTestingResults(cr.id, testingData);

      // Finally, approve to move to next stage
      await changeRequestService.approve(cr.id, {
        signatureFilePath: signatureFile,
        comments: 'IT Officer assessment completed',
      });

      message.success('Assessment submitted successfully! CR moved to Requestor Test Confirmation.');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const deploymentTeamColumns = [
    {
      title: 'Select Member',
      dataIndex: 'memberId',
      key: 'memberId',
      width: '25%',
      render: (value: number | null, record: DeploymentTeamMember) => (
        <Select
          value={value}
          onChange={(userId) => handleUserSelect(record.key, userId)}
          placeholder="Select user"
          showSearch
          filterOption={(input, option) =>
            (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
          loading={loadingUsers}
        >
          {availableUsers.map((user) => (
            <Option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'memberName',
      key: 'memberName',
      width: '20%',
      render: (text: string) => <span>{text || '-'}</span>,
    },
    {
      title: 'Designation/Dept',
      dataIndex: 'designation',
      key: 'designation',
      width: '20%',
      render: (text: string, record: DeploymentTeamMember) => (
        <Input
          value={text}
          onChange={(e) => updateDeploymentTeamMember(record.key, 'designation', e.target.value)}
          placeholder="Department/Role"
        />
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '15%',
      render: (text: string) => <span>{text || '-'}</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: '15%',
      render: (text: string, record: DeploymentTeamMember) => (
        <Input
          value={text}
          onChange={(e) => updateDeploymentTeamMember(record.key, 'phone', e.target.value)}
          placeholder="Phone number"
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '5%',
      render: (_: any, record: DeploymentTeamMember) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeDeploymentTeamMember(record.key)}
        />
      ),
    },
  ];

  return (
    <div>
      <Alert
        message="IT Officer Technical Assessment"
        description="Complete all sections including impact assessment, deployment planning, team composition, and testing results. All fields marked with * are required."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          impactsClientService: false,
          downtimeDays: 0,
          downtimeHours: 0,
          downtimeMinutes: 0,
          costInvolved: 0,
        }}
      >
        <Card title="Classification" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select a category' }]}
              >
                <Select placeholder="Select category" onChange={handleCategoryChange}>
                  {Object.keys(CR_CATEGORIES).map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subcategory"
                label="Subcategory"
                rules={[{ required: true, message: 'Please select a subcategory' }]}
              >
                <Select placeholder="Select subcategory" disabled={!selectedCategory}>
                  {subcategories.map((subcat) => (
                    <Option key={subcat} value={subcat}>
                      {subcat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="impactsClientService"
            label="Does this change impact client service?"
            valuePropName="checked"
          >
            <Checkbox>Yes, this change impacts client service</Checkbox>
          </Form.Item>
        </Card>

        <Card title="Impact & Risk Assessment" style={{ marginBottom: 16 }}>
          <Form.Item
            name="impactAssessment"
            label="Impact Assessment"
            rules={[{ required: true, message: 'Please provide impact assessment' }]}
          >
            <TextArea
              placeholder="Describe the potential impact of this change on systems, services, and users..."
              rows={5}
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="backoutRollbackPlan"
            label="Backout/Rollback Plan"
            rules={[{ required: true, message: 'Please provide rollback plan' }]}
          >
            <TextArea
              placeholder="Describe the step-by-step plan to rollback changes if issues occur..."
              rows={5}
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Expected Downtime"
            required
            extra="Specify the total expected downtime in days, hours, and minutes"
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="downtimeDays"
                  noStyle
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber min={0} max={30} style={{ width: '100%' }} addonAfter="Days" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="downtimeHours"
                  noStyle
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber min={0} max={23} style={{ width: '100%' }} addonAfter="Hours" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="downtimeMinutes"
                  noStyle
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <InputNumber min={0} max={59} style={{ width: '100%' }} addonAfter="Mins" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item name="costInvolved" label="Cost Involved (BHD)">
            <InputNumber
              min={0}
              step={0.001}
              precision={3}
              style={{ width: '100%' }}
              placeholder="0.000"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plannedDatetime"
                label="Planned Date & Time"
                rules={[{ required: true, message: 'Please select planned date/time' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  showNow={false}
                  needConfirm={false}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastBackupDate"
                label="Last Backup Date"
                rules={[{ required: true, message: 'Please select last backup date' }]}
              >
                <DatePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                  showNow={false}
                  needConfirm={false}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="UAT Documentation" style={{ marginBottom: 16 }}>
          <Form.Item
            label="Upload UAT Documentation"
            extra="Attach documentation for future reference (max 10MB)"
          >
            <Upload beforeUpload={handleUATDocumentUpload} showUploadList={false}>
              <Button icon={<UploadOutlined />}>Select Document</Button>
            </Upload>
            {uatDocumentName && (
              <div style={{ marginTop: 8 }}>
                Selected: <strong>{uatDocumentName}</strong>
              </div>
            )}
          </Form.Item>
        </Card>

        <Card title="Deployment Team" style={{ marginBottom: 16 }}>
          <Alert
            message="Select team members from the user list. Their name and email will be auto-filled. You can add phone numbers manually."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Button
            type="dashed"
            onClick={addDeploymentTeamMember}
            icon={<PlusOutlined />}
            style={{ marginBottom: 16 }}
          >
            Add Team Member
          </Button>
          <Table
            dataSource={deploymentTeam}
            columns={deploymentTeamColumns}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 900 }}
          />
        </Card>

        <Card title="Testing Results" style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            onClick={addTestResult}
            icon={<PlusOutlined />}
            style={{ marginBottom: 16 }}
          >
            Add Test Case
          </Button>

          {testResults.map((test, index) => (
            <Card
              key={test.key}
              size="small"
              title={`Test Case ${index + 1}`}
              extra={
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeTestResult(test.key)}
                >
                  Remove
                </Button>
              }
              style={{ marginBottom: 8 }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Input
                    value={test.testCase}
                    onChange={(e) => updateTestResult(test.key, 'testCase', e.target.value)}
                    placeholder="Test Case Description"
                    style={{ marginBottom: 8 }}
                  />
                </Col>
                <Col span={12}>
                  <TextArea
                    value={test.expectedResult}
                    onChange={(e) => updateTestResult(test.key, 'expectedResult', e.target.value)}
                    placeholder="Expected Result"
                    rows={2}
                    style={{ marginBottom: 8 }}
                  />
                </Col>
                <Col span={12}>
                  <TextArea
                    value={test.actualResult}
                    onChange={(e) => updateTestResult(test.key, 'actualResult', e.target.value)}
                    placeholder="Actual Result"
                    rows={2}
                    style={{ marginBottom: 8 }}
                  />
                </Col>
                <Col span={12}>
                  <Checkbox
                    checked={test.passed}
                    onChange={(e) => updateTestResult(test.key, 'passed', e.target.checked)}
                  >
                    Test Passed
                  </Checkbox>
                </Col>
                <Col span={12}>
                  <Input
                    value={test.remarks}
                    onChange={(e) => updateTestResult(test.key, 'remarks', e.target.value)}
                    placeholder="Remarks (optional)"
                  />
                </Col>
              </Row>
            </Card>
          ))}

          <Form.Item name="testingNotes" label="Additional Testing Notes">
            <TextArea placeholder="Any additional notes about the testing..." rows={3} />
          </Form.Item>
        </Card>

        <Card title="IT Officer Signature" style={{ marginBottom: 16 }}>
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
            icon={<SendOutlined />}
          >
            Submit for Requestor Test Confirmation
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ITOfficerAssessmentForm;
