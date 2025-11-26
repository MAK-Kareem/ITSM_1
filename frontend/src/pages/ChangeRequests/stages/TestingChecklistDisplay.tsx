import React from 'react';
import { Card, Row, Col, Tag, Typography, Table, Divider, Alert, Space } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';

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

interface Props {
  checklistJson: string;
}

const TestingChecklistDisplay: React.FC<Props> = ({ checklistJson }) => {
  let data: any;

  try {
    data = JSON.parse(checklistJson);
  } catch (e) {
    return (
      <Alert
        message="Unable to parse checklist data"
        description="The checklist data format is invalid."
        type="error"
        showIcon
      />
    );
  }

  const { schemes, additionalChecks, summary } = data;

  const renderIcon = (value: boolean | null) => {
    if (value === true) return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
    if (value === false) return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />;
    return <MinusCircleOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />;
  };

  const renderSchemeTable = (scheme: SchemeChecklist) => {
    if (!scheme.enabled) return null;

    const columns = [
      {
        title: 'Transaction Type',
        dataIndex: 'transactionType',
        key: 'transactionType',
        width: '40%',
      },
      {
        title: 'INSERT',
        dataIndex: 'insert',
        key: 'insert',
        align: 'center' as const,
        render: (value: boolean | null) => renderIcon(value),
      },
      {
        title: 'TAP',
        dataIndex: 'tap',
        key: 'tap',
        align: 'center' as const,
        render: (value: boolean | null) => renderIcon(value),
      },
      {
        title: 'MANUAL',
        dataIndex: 'manual',
        key: 'manual',
        align: 'center' as const,
        render: (value: boolean | null) => renderIcon(value),
      },
      {
        title: 'FALLBACK',
        dataIndex: 'fallback',
        key: 'fallback',
        align: 'center' as const,
        render: (value: boolean | null) => renderIcon(value),
      },
    ];

    const testedCount = scheme.items.filter(
      (item) =>
        item.insert !== null || item.tap !== null || item.manual !== null || item.fallback !== null
    ).length;

    return (
      <Card
        key={scheme.schemeName}
        size="small"
        title={
          <Space>
            <Text strong>{scheme.schemeName}</Text>
            <Tag color="blue">
              {testedCount}/{scheme.items.length} transactions tested
            </Tag>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          dataSource={scheme.items}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="transactionType"
        />
      </Card>
    );
  };

  const renderAdditionalChecks = () => {
    if (!additionalChecks) return null;

    const categories = [
      {
        name: 'Additional Transactions',
        items: ['BenefitPay Tap (Android)', 'BenefitPay QR', 'BinancePay QR'],
      },
      {
        name: 'Slip Formats',
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
      {
        name: 'Digital Receipts',
        items: ['SMS', 'Email'],
      },
    ];

    return (
      <Card title="Additional Checks" size="small" style={{ marginBottom: 16 }}>
        {categories.map((category) => (
          <div key={category.name} style={{ marginBottom: 12 }}>
            <Text strong style={{ color: '#1890ff', fontSize: 13 }}>
              {category.name}
            </Text>
            <Divider style={{ margin: '8px 0' }} />
            <Row gutter={[8, 8]}>
              {category.items.map((item) => (
                <Col span={8} key={item}>
                  <Space size="small">
                    {renderIcon(additionalChecks[item])}
                    <Text style={{ fontSize: 12 }}>{item}</Text>
                  </Space>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Card>
    );
  };

  const enabledSchemes = schemes?.filter((s: SchemeChecklist) => s.enabled) || [];

  return (
    <div>
      {/* Summary Card */}
      <Card style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
        <Row gutter={16} justify="center">
          <Col span={6} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#595959' }}>
              {summary?.totalTests || 0}
            </div>
            <div style={{ color: '#8c8c8c' }}>Total Tests</div>
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
              {summary?.passed || 0}
            </div>
            <div style={{ color: '#8c8c8c' }}>Passed</div>
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
              {summary?.failed || 0}
            </div>
            <div style={{ color: '#8c8c8c' }}>Failed</div>
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#d9d9d9' }}>
              {summary?.notTested || 0}
            </div>
            <div style={{ color: '#8c8c8c' }}>Not Tested</div>
          </Col>
        </Row>
      </Card>

      {/* Legend */}
      <Alert
        message={
          <Space split={<Divider type="vertical" />}>
            <span>
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> Passed
            </span>
            <span>
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Failed
            </span>
            <span>
              <MinusCircleOutlined style={{ color: '#d9d9d9' }} /> Not Tested
            </span>
          </Space>
        }
        type="info"
        style={{ marginBottom: 16 }}
      />

      {/* Card Schemes */}
      {enabledSchemes.length > 0 ? (
        <>
          <Title level={5}>Card Scheme Testing Results</Title>
          <Row gutter={16}>
            {enabledSchemes.map((scheme: SchemeChecklist) => (
              <Col span={24} key={scheme.schemeName}>
                {renderSchemeTable(scheme)}
              </Col>
            ))}
          </Row>
        </>
      ) : (
        <Alert
          message="No card schemes were tested"
          description="No card scheme testing was performed for this change request."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Additional Checks */}
      <Title level={5}>Additional Testing</Title>
      {renderAdditionalChecks()}
    </div>
  );
};

export default TestingChecklistDisplay;
