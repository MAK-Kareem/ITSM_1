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
  Table,
  Tag,
  Checkbox,
  Divider,
  Row,
  Col,
  Typography,
  Tooltip,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  CheckOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { ChangeRequest, CRTestingResult } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import authService from '../../../services/auth.service';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Props {
  cr: ChangeRequest;
  testingResults: CRTestingResult[];
  onSuccess: () => void;
}

interface TestConfirmation {
  testCase: string;
  expectedResult: string;
  actualResult: string;
  itoResult: boolean;
  requestorConfirmed: boolean;
  requestorRemarks: string;
}

interface ChecklistItem {
  transactionType: string;
  insert: boolean | null;
  tap: boolean | null;
  manual: boolean | null;
  fallback: boolean | null;
}

interface SchemeChecklist {
  schemeName: string;
  enabled: boolean;
  items: ChecklistItem[];
}

const TRANSACTION_TYPES = [
  'Purchase',
  'Void',
  'Refund (full)',
  'Refund (partial)',
  'Purchase with Tip',
  'Purchase and Tip',
  'ApplePay',
  'SamsungPay',
  'Preauth',
  'Preauth Completion',
  'DCC',
  'Mada',
];

const CARD_SCHEMES = ['BENEFIT', 'VISA', 'MASTERCARD', 'AMEX', 'JCB', 'UNIONPAY'];

const ADDITIONAL_CHECKS = [
  { category: 'Additional Transactions', items: ['BenefitPay Tap (Android)', 'BenefitPay QR', 'BinancePay QR'] },
  {
    category: 'Slip Formats',
    items: [
      'Merchant Copy Format',
      'Customer Copy Format',
      'Detail Report Format',
      'Summary Report Format',
      'Settlement Report Format',
      'Void Format',
      'Refund Format',
      'Reprint Format',
      'Declined History',
      'Settlement History',
    ],
  },
  { category: 'Digital Receipts', items: ['SMS', 'Email'] },
];

const createEmptySchemeChecklist = (schemeName: string): SchemeChecklist => ({
  schemeName,
  enabled: false,
  items: TRANSACTION_TYPES.map((type) => ({
    transactionType: type,
    insert: null,
    tap: null,
    manual: null,
    fallback: null,
  })),
});

const RequestorTestConfirmationForm: React.FC<Props> = ({ cr, testingResults, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState<TestConfirmation[]>([]);

  // New checklist state
  const [schemes, setSchemes] = useState<SchemeChecklist[]>(
    CARD_SCHEMES.map(createEmptySchemeChecklist)
  );
  const [additionalChecks, setAdditionalChecks] = useState<{ [key: string]: boolean | null }>(
    ADDITIONAL_CHECKS.flatMap((cat) => cat.items).reduce((acc, item) => ({ ...acc, [item]: null }), {})
  );

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadSavedSignature();
    initializeConfirmations();
  }, [testingResults]);

  const loadSavedSignature = () => {
    const savedSignature = localStorage.getItem(`user_signature_${currentUser?.id}`);
    if (savedSignature) {
      setSignatureFile(savedSignature);
      setSignaturePreview(savedSignature);
    }
  };

  const initializeConfirmations = () => {
    if (testingResults.length > 0) {
      const latestTest = testingResults[testingResults.length - 1];
      const initialConfirmations = latestTest.testResults.map((result: any) => ({
        testCase: result.testCase,
        expectedResult: result.expectedResult,
        actualResult: result.actualResult,
        itoResult: result.passed,
        requestorConfirmed: false,
        requestorRemarks: '',
      }));
      setConfirmations(initialConfirmations);
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

  const updateConfirmation = (index: number, field: string, value: any) => {
    const updated = [...confirmations];
    updated[index] = { ...updated[index], [field]: value };
    setConfirmations(updated);
  };

  // Checklist functions
  const toggleScheme = (schemeName: string) => {
    setSchemes((prev) =>
      prev.map((scheme) =>
        scheme.schemeName === schemeName ? { ...scheme, enabled: !scheme.enabled } : scheme
      )
    );
  };

  const cycleValue = (current: boolean | null): boolean | null => {
    if (current === null) return true;
    if (current === true) return false;
    return null;
  };

  const updateChecklistItem = (
    schemeName: string,
    transactionType: string,
    method: string,
    value: boolean | null
  ) => {
    setSchemes((prev) =>
      prev.map((scheme) =>
        scheme.schemeName === schemeName
          ? {
              ...scheme,
              items: scheme.items.map((item) =>
                item.transactionType === transactionType ? { ...item, [method]: value } : item
              ),
            }
          : scheme
      )
    );
  };

  const calculateSummary = () => {
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let notTested = 0;

    schemes.forEach((scheme) => {
      if (scheme.enabled) {
        scheme.items.forEach((item) => {
          ['insert', 'tap', 'manual', 'fallback'].forEach((method) => {
            totalTests++;
            const value = item[method as keyof ChecklistItem];
            if (value === true) passed++;
            else if (value === false) failed++;
            else notTested++;
          });
        });
      }
    });

    Object.values(additionalChecks).forEach((value) => {
      totalTests++;
      if (value === true) passed++;
      else if (value === false) failed++;
      else notTested++;
    });

    return { totalTests, passed, failed, notTested };
  };

  const renderCheckbox = (value: boolean | null, onClick: () => void) => (
    <Tooltip title="Click to cycle: Not Tested → Pass → Fail">
      <Button type="text" size="small" onClick={onClick} style={{ padding: 0, width: 24, height: 24 }}>
        {value === true && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />}
        {value === false && <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />}
        {value === null && <MinusCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />}
      </Button>
    </Tooltip>
  );

  const renderSchemeCard = (scheme: SchemeChecklist) => (
    <Card
      key={scheme.schemeName}
      size="small"
      title={
        <Space>
          <Checkbox checked={scheme.enabled} onChange={() => toggleScheme(scheme.schemeName)}>
            <Text strong>{scheme.schemeName}</Text>
          </Checkbox>
          {scheme.enabled && (
            <Tag color="blue">
              {
                scheme.items.filter(
                  (i) => i.insert !== null || i.tap !== null || i.manual !== null || i.fallback !== null
                ).length
              }
              /{scheme.items.length} tested
            </Tag>
          )}
        </Space>
      }
      style={{ marginBottom: 12, opacity: scheme.enabled ? 1 : 0.5 }}
      bodyStyle={{ padding: scheme.enabled ? 12 : 8 }}
    >
      {scheme.enabled ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                  Transaction
                </th>
                <th style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 60 }}>
                  INSERT
                </th>
                <th style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 60 }}>
                  TAP
                </th>
                <th style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 60 }}>
                  MANUAL
                </th>
                <th style={{ padding: '6px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 60 }}>
                  FALLBACK
                </th>
              </tr>
            </thead>
            <tbody>
              {scheme.items.map((item, idx) => (
                <tr key={item.transactionType} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                    {item.transactionType}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.insert, () =>
                      updateChecklistItem(scheme.schemeName, item.transactionType, 'insert', cycleValue(item.insert))
                    )}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.tap, () =>
                      updateChecklistItem(scheme.schemeName, item.transactionType, 'tap', cycleValue(item.tap))
                    )}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.manual, () =>
                      updateChecklistItem(scheme.schemeName, item.transactionType, 'manual', cycleValue(item.manual))
                    )}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.fallback, () =>
                      updateChecklistItem(scheme.schemeName, item.transactionType, 'fallback', cycleValue(item.fallback))
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Text type="secondary" italic>
          Click checkbox to enable {scheme.schemeName} testing
        </Text>
      )}
    </Card>
  );

  const handleSubmit = async (values: any) => {
    if (!signatureFile) {
      message.error('Please upload your signature');
      return;
    }

    // Check if all ITO tests are confirmed
    const allConfirmed = confirmations.every((c) => c.requestorConfirmed);
    if (!allConfirmed) {
      message.error('Please confirm all IT Officer test results before submitting');
      return;
    }

    const summary = calculateSummary();

    setLoading(true);
    try {
      // Add requestor's confirmation as a new testing result
      const confirmationData = {
        testType: 'Requestor_Confirmation',
        testResults: [
          ...confirmations.map((c) => ({
            testCase: c.testCase,
            expectedResult: c.expectedResult,
            actualResult: c.actualResult,
            passed: c.requestorConfirmed && c.itoResult,
            remarks: c.requestorRemarks || 'Confirmed by Requestor',
          })),
          {
            testCase: 'POS & Switch Testing Checklist',
            expectedResult: 'All selected tests pass',
            actualResult: `Passed: ${summary.passed}, Failed: ${summary.failed}, Not Tested: ${summary.notTested}`,
            passed: summary.failed === 0,
            remarks: JSON.stringify({ schemes, additionalChecks, summary }),
          },
        ],
        passed: confirmations.every((c) => c.requestorConfirmed && c.itoResult) && summary.failed === 0,
        notes:
          values.confirmationNotes ||
          `Requestor confirmed with ${summary.passed} passed, ${summary.failed} failed tests`,
      };

      await changeRequestService.addTestingResults(cr.id, confirmationData);

      // Approve to move to QA validation
      await changeRequestService.approve(cr.id, {
        signatureFilePath: signatureFile,
        comments: values.confirmationNotes || 'Test results confirmed by Requestor',
      });

      message.success('Test results confirmed! CR sent to QA Officer for validation.');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const summary = calculateSummary();

  if (testingResults.length === 0) {
    return (
      <Alert
        message="No Testing Results Available"
        description="The IT Officer has not yet submitted testing results for this CR."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      <Alert
        message="Requestor Test Confirmation"
        description="Please review the IT Officer's testing results and complete the POS & Switch testing checklist. Your confirmation will move the CR to QA Validation stage."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* IT Officer Results Review */}
        <Card title="IT Officer Test Results Review" style={{ marginBottom: 16 }}>
          {confirmations.map((confirmation, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 8 }}
              title={`Test Case ${index + 1}: ${confirmation.testCase}`}
            >
              <div style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <strong>Expected Result:</strong>
                    <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                      {confirmation.expectedResult}
                    </div>
                  </Col>
                  <Col span={12}>
                    <strong>Actual Result:</strong>
                    <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                      {confirmation.actualResult}
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 8 }}>
                  <strong>IT Officer Result:</strong>{' '}
                  <Tag color={confirmation.itoResult ? 'green' : 'red'}>
                    {confirmation.itoResult ? 'PASSED' : 'FAILED'}
                  </Tag>
                </div>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div>
                <Checkbox
                  checked={confirmation.requestorConfirmed}
                  onChange={(e) => updateConfirmation(index, 'requestorConfirmed', e.target.checked)}
                  style={{ marginBottom: 8 }}
                >
                  <strong>I confirm this test result is accurate</strong>
                </Checkbox>
                <Input
                  placeholder="Add your remarks (optional)"
                  value={confirmation.requestorRemarks}
                  onChange={(e) => updateConfirmation(index, 'requestorRemarks', e.target.value)}
                />
              </div>
            </Card>
          ))}
        </Card>

        {/* POS & Switch Testing Checklist */}
        <Card
          title="POS & Switch Testing Checklist"
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Tag color="green">{summary.passed} Passed</Tag>
              <Tag color="red">{summary.failed} Failed</Tag>
              <Tag color="default">{summary.notTested} Not Tested</Tag>
            </Space>
          }
        >
          <Alert
            message="Click on icons to cycle: Not Tested → Pass → Fail"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Title level={5}>Card Scheme Testing</Title>
          <Row gutter={16}>
            {schemes.map((scheme) => (
              <Col span={12} key={scheme.schemeName}>
                {renderSchemeCard(scheme)}
              </Col>
            ))}
          </Row>

          <Title level={5} style={{ marginTop: 16 }}>
            Additional Checks
          </Title>
          {ADDITIONAL_CHECKS.map((category) => (
            <Card key={category.category} size="small" title={category.category} style={{ marginBottom: 12 }}>
              <Row gutter={[16, 8]}>
                {category.items.map((item) => (
                  <Col span={8} key={item}>
                    <Space>
                      {renderCheckbox(additionalChecks[item], () =>
                        setAdditionalChecks((prev) => ({
                          ...prev,
                          [item]: cycleValue(prev[item]),
                        }))
                      )}
                      <Text style={{ fontSize: 12 }}>{item}</Text>
                    </Space>
                  </Col>
                ))}
              </Row>
            </Card>
          ))}
        </Card>

        {/* Confirmation Summary */}
        <Card title="Confirmation Summary" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <strong>IT Officer Tests:</strong>
              <br />
              Confirmed: {confirmations.filter((c) => c.requestorConfirmed).length}/{confirmations.length}
            </Col>
            <Col span={12}>
              <strong>POS & Switch Tests:</strong>
              <br />
              Passed: {summary.passed}, Failed: {summary.failed}, Not Tested: {summary.notTested}
            </Col>
          </Row>

          <Divider />

          {confirmations.every((c) => c.requestorConfirmed) && summary.failed === 0 ? (
            <Alert message="All confirmations complete!" type="success" showIcon />
          ) : (
            <Alert
              message={
                !confirmations.every((c) => c.requestorConfirmed)
                  ? 'Please confirm all IT Officer test results'
                  : `${summary.failed} test(s) failed in checklist`
              }
              type="warning"
              showIcon
            />
          )}
        </Card>

        <Form.Item name="confirmationNotes" label="Additional Notes (Optional)">
          <TextArea placeholder="Add any additional notes or observations..." rows={4} maxLength={1000} showCount />
        </Form.Item>

        <Card title="Your Signature" style={{ marginBottom: 16 }}>
          <Form.Item
            label="Upload Signature"
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
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<SendOutlined />}
            disabled={!confirmations.every((c) => c.requestorConfirmed)}
          >
            Submit Confirmation for QA Testing and Validation
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RequestorTestConfirmationForm;
