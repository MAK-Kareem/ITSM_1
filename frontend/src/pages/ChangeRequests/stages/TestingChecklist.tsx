import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Row, Col, Typography, Divider, Space, Tag, Alert, Button, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

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

interface AdditionalChecklist {
  category: string;
  items: Array<{
    name: string;
    checked: boolean | null;
  }>;
}

interface Props {
  onChange: (data: {
    schemes: SchemeChecklist[];
    additionalChecks: AdditionalChecklist[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      notTested: number;
    };
  }) => void;
  initialData?: {
    schemes: SchemeChecklist[];
    additionalChecks: AdditionalChecklist[];
  };
  readOnly?: boolean;
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

const ADDITIONAL_TRANSACTIONS = [
  'BenefitPay Tap (Android)',
  'BenefitPay QR',
  'BinancePay QR',
];

const SLIP_CHECKS = [
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
];

const DIGITAL_RECEIPTS = ['SMS', 'Email'];

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

const TestingChecklist: React.FC<Props> = ({ onChange, initialData, readOnly = false }) => {
  const [schemes, setSchemes] = useState<SchemeChecklist[]>(
    initialData?.schemes || CARD_SCHEMES.map(createEmptySchemeChecklist)
  );

  const [additionalChecks, setAdditionalChecks] = useState<AdditionalChecklist[]>(
    initialData?.additionalChecks || [
      {
        category: 'Additional Transactions',
        items: ADDITIONAL_TRANSACTIONS.map((name) => ({ name, checked: null })),
      },
      {
        category: 'Slip Formats',
        items: SLIP_CHECKS.map((name) => ({ name, checked: null })),
      },
      {
        category: 'Digital Receipts',
        items: DIGITAL_RECEIPTS.map((name) => ({ name, checked: null })),
      },
    ]
  );

  useEffect(() => {
    const summary = calculateSummary();
    onChange({ schemes, additionalChecks, summary });
  }, [schemes, additionalChecks]);

  const calculateSummary = () => {
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let notTested = 0;

    // Count scheme tests
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

    // Count additional checks
    additionalChecks.forEach((category) => {
      category.items.forEach((item) => {
        totalTests++;
        if (item.checked === true) passed++;
        else if (item.checked === false) failed++;
        else notTested++;
      });
    });

    return { totalTests, passed, failed, notTested };
  };

  const toggleScheme = (schemeName: string) => {
    if (readOnly) return;
    setSchemes((prev) =>
      prev.map((scheme) =>
        scheme.schemeName === schemeName ? { ...scheme, enabled: !scheme.enabled } : scheme
      )
    );
  };

  const updateChecklistItem = (
    schemeName: string,
    transactionType: string,
    method: string,
    value: boolean | null
  ) => {
    if (readOnly) return;
    setSchemes((prev) =>
      prev.map((scheme) =>
        scheme.schemeName === schemeName
          ? {
              ...scheme,
              items: scheme.items.map((item) =>
                item.transactionType === transactionType
                  ? { ...item, [method]: value }
                  : item
              ),
            }
          : scheme
      )
    );
  };

  const updateAdditionalCheck = (categoryIndex: number, itemIndex: number, value: boolean | null) => {
    if (readOnly) return;
    setAdditionalChecks((prev) =>
      prev.map((category, cIdx) =>
        cIdx === categoryIndex
          ? {
              ...category,
              items: category.items.map((item, iIdx) =>
                iIdx === itemIndex ? { ...item, checked: value } : item
              ),
            }
          : category
      )
    );
  };

  const cycleValue = (current: boolean | null): boolean | null => {
    if (current === null) return true;
    if (current === true) return false;
    return null;
  };

  const renderCheckbox = (value: boolean | null, onClick: () => void) => {
    if (readOnly) {
      if (value === true) return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
      if (value === false) return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />;
      return <MinusCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />;
    }

    return (
      <Tooltip title="Click to cycle: Not Tested → Pass → Fail">
        <Button
          type="text"
          size="small"
          onClick={onClick}
          style={{ padding: 0, width: 24, height: 24 }}
        >
          {value === true && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />}
          {value === false && <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />}
          {value === null && <MinusCircleOutlined style={{ color: '#d9d9d9', fontSize: 18 }} />}
        </Button>
      </Tooltip>
    );
  };

  const renderSchemeCard = (scheme: SchemeChecklist) => (
    <Card
      key={scheme.schemeName}
      title={
        <Space>
          <Checkbox
            checked={scheme.enabled}
            onChange={() => toggleScheme(scheme.schemeName)}
            disabled={readOnly}
          >
            <Text strong style={{ fontSize: 16 }}>
              {scheme.schemeName}
            </Text>
          </Checkbox>
          {scheme.enabled && (
            <Tag color="blue">
              {scheme.items.filter((i) => i.insert || i.tap || i.manual || i.fallback).length}/
              {scheme.items.length} tested
            </Tag>
          )}
        </Space>
      }
      style={{
        marginBottom: 16,
        opacity: scheme.enabled ? 1 : 0.5,
        transition: 'opacity 0.3s',
      }}
      bodyStyle={{ padding: scheme.enabled ? 16 : 8 }}
    >
      {scheme.enabled ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                  Transaction Type
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 80 }}>
                  INSERT
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 80 }}>
                  TAP
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 80 }}>
                  MANUAL
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0', width: 80 }}>
                  FALLBACK
                </th>
              </tr>
            </thead>
            <tbody>
              {scheme.items.map((item, idx) => (
                <tr
                  key={item.transactionType}
                  style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}
                >
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    {item.transactionType}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.insert, () =>
                      updateChecklistItem(scheme.schemeName, item.transactionType, 'insert', cycleValue(item.insert))
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.tap, () =>
                      updateChecklistItem(scheme.schemeName, item.transactionType, 'tap', cycleValue(item.tap))
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                    {renderCheckbox(item.manual, () =>
                      updateChecklistItem(scheme.schemeName, item.transactionType, 'manual', cycleValue(item.manual))
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
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
          Click checkbox above to enable testing for {scheme.schemeName}
        </Text>
      )}
    </Card>
  );

  const renderAdditionalChecks = () => (
    <Card title="Additional Testing" style={{ marginBottom: 16 }}>
      {additionalChecks.map((category, cIdx) => (
        <div key={category.category} style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
            {category.category}
          </Text>
          <Divider style={{ margin: '8px 0' }} />
          <Row gutter={[16, 8]}>
            {category.items.map((item, iIdx) => (
              <Col span={8} key={item.name}>
                <Space>
                  {renderCheckbox(item.checked, () =>
                    updateAdditionalCheck(cIdx, iIdx, cycleValue(item.checked))
                  )}
                  <Text>{item.name}</Text>
                </Space>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </Card>
  );

  const summary = calculateSummary();

  return (
    <div>
      <Alert
        message="POS & Switch Testing Checklist"
        description={
          <div>
            <p>Select the card schemes to test by checking the boxes. Click on each test result icon to cycle through:</p>
            <Space>
              <MinusCircleOutlined style={{ color: '#d9d9d9' }} /> Not Tested
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> Pass
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Fail
            </Space>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="Total Tests" value={summary.totalTests} />
          </Col>
          <Col span={6}>
            <Statistic title="Passed" value={summary.passed} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Failed" value={summary.failed} valueStyle={{ color: '#ff4d4f' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Not Tested" value={summary.notTested} valueStyle={{ color: '#d9d9d9' }} />
          </Col>
        </Row>
      </Card>

      <Title level={4}>Card Scheme Testing</Title>
      {schemes.map(renderSchemeCard)}

      <Title level={4}>Additional Checks</Title>
      {renderAdditionalChecks()}
    </div>
  );
};

// Simple Statistic component
const Statistic: React.FC<{ title: string; value: number; valueStyle?: React.CSSProperties }> = ({
  title,
  value,
  valueStyle,
}) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 24, fontWeight: 'bold', ...valueStyle }}>{value}</div>
    <div style={{ color: '#8c8c8c' }}>{title}</div>
  </div>
);

export default TestingChecklist;
