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
  Checkbox,
  Divider,
  Row,
  Col,
  Typography,
  Tooltip,
  Tag,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { ChangeRequest } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import authService from '../../../services/auth.service';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Props {
  cr: ChangeRequest;
  onSuccess: () => void;
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

const QAOfficerValidationForm: React.FC<Props> = ({ cr, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  // POS Testing checklist state
  const [schemes, setSchemes] = useState<SchemeChecklist[]>(CARD_SCHEMES.map(createEmptySchemeChecklist));
  const [additionalChecks, setAdditionalChecks] = useState<{ [key: string]: boolean | null }>(
    ADDITIONAL_CHECKS.flatMap((cat) => cat.items).reduce((acc, item) => ({ ...acc, [item]: null }), {})
  );

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

  // POS Testing Checklist functions
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

  const updatePOSChecklistItem = (
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
                      updatePOSChecklistItem(scheme.schemeName, item.transactionType, 'insert', cycleValue(item.insert))
                    )}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.tap, () =>
                      updatePOSChecklistItem(scheme.schemeName, item.transactionType, 'tap', cycleValue(item.tap))
                    )}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.manual, () =>
                      updatePOSChecklistItem(scheme.schemeName, item.transactionType, 'manual', cycleValue(item.manual))
                    )}
                  </td>
                  <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.fallback, () =>
                      updatePOSChecklistItem(scheme.schemeName, item.transactionType, 'fallback', cycleValue(item.fallback))
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

    const summary = calculateSummary();

    if (summary.failed > 0) {
      const confirmed = window.confirm(
        `You have ${summary.failed} failed tests. QA validation with failures may require re-work. Continue anyway?`
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      // Save QA checklist with POS testing results
      const checklistData = {
        checklistData: [
          {
            checkItem: 'POS & Switch Testing Validation',
            checked: summary.failed === 0,
            remarks: `Passed: ${summary.passed}, Failed: ${summary.failed}, Not Tested: ${summary.notTested}. Details: ${JSON.stringify(
              { schemes, additionalChecks, summary }
            )}`,
          },
        ],
        validated: summary.failed === 0,
        notes:
          values.validationNotes ||
          `QA validation completed. POS Testing: ${summary.passed} passed, ${summary.failed} failed, ${summary.notTested} not tested`,
      };

      await changeRequestService.addQAChecklist(cr.id, checklistData);

      // Approve to move to production approval
      await changeRequestService.approve(cr.id, {
        signatureFilePath: signatureFile,
        comments: values.validationNotes || 'QA validation completed successfully',
      });

      message.success('QA validation completed! CR sent to Head of IT for production approval.');
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const summary = calculateSummary();

  return (
    <div>
      <Alert
        message="QA Officer Validation"
        description="Complete the POS & Switch testing validation independently. Your validation ensures quality assurance before production deployment."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* POS & Switch Testing Checklist */}
        <Card
          title="QA POS & Switch Testing Validation"
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
            message="Independent QA Validation: Click on icons to cycle through test results"
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

        {/* Validation Summary */}
        <Card title="Validation Summary" style={{ marginBottom: 16 }}>
          <Row gutter={16} justify="center">
            <Col span={6} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#595959' }}>{summary.totalTests}</div>
              <div style={{ color: '#8c8c8c' }}>Total Tests</div>
            </Col>
            <Col span={6} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{summary.passed}</div>
              <div style={{ color: '#8c8c8c' }}>Passed</div>
            </Col>
            <Col span={6} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>{summary.failed}</div>
              <div style={{ color: '#8c8c8c' }}>Failed</div>
            </Col>
            <Col span={6} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#d9d9d9' }}>{summary.notTested}</div>
              <div style={{ color: '#8c8c8c' }}>Not Tested</div>
            </Col>
          </Row>

          <Divider />

          {summary.failed === 0 ? (
            <Alert
              message="All tests passed!"
              description="You can now submit for production approval."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          ) : (
            <Alert
              message={`${summary.failed} test(s) failed`}
              description="Consider rejecting or requesting fixes before proceeding."
              type="error"
              showIcon
            />
          )}
        </Card>

        <Form.Item name="validationNotes" label="QA Validation Notes (Optional)">
          <TextArea
            placeholder="Add any additional notes about the QA validation..."
            rows={4}
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Card title="QA Officer Signature" style={{ marginBottom: 16 }}>
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
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            icon={<SendOutlined />}
          >
            Submit for Production Approval
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default QAOfficerValidationForm;
