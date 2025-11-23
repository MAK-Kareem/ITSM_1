import React from 'react';
import { Card, Tag, Typography, Collapse, Divider, Row, Col, Space, Alert } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { CRTestingResult } from '../../../types/change-request.types';
import TestingChecklistDisplay from './TestingChecklistDisplay';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface Props {
  testingResults: CRTestingResult[];
}

const TestingResultsView: React.FC<Props> = ({ testingResults }) => {
  if (!testingResults || testingResults.length === 0) {
    return (
      <Alert
        message="No Testing Results"
        description="No testing results have been recorded for this change request."
        type="info"
        showIcon
      />
    );
  }

  const renderTestResult = (result: any, index: number) => {
    // Check if this is a POS & Switch Checklist result
    const isChecklistResult = result.testCase === 'POS & Switch Testing Checklist';

    if (isChecklistResult && result.remarks) {
      try {
        // Try to parse as JSON checklist data
        const checklistData = JSON.parse(result.remarks);
        if (checklistData.schemes && checklistData.additionalChecks) {
          return (
            <Card
              key={index}
              size="small"
              title={
                <Space>
                  <Text strong>POS & Switch Testing Checklist</Text>
                  <Tag color={result.passed ? 'green' : 'red'}>
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </Tag>
                </Space>
              }
              style={{ marginBottom: 12 }}
            >
              <TestingChecklistDisplay checklistJson={result.remarks} />
            </Card>
          );
        }
      } catch (e) {
        // Not valid JSON, render as regular test result
      }
    }

    // Regular test result display
    return (
      <Card key={index} size="small" style={{ marginBottom: 8 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Text strong>Test Case:</Text> {result.testCase}
          </Col>
          <Col span={12}>
            <Text type="secondary">Expected:</Text>
            <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
              {result.expectedResult}
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary">Actual:</Text>
            <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
              {result.actualResult}
            </div>
          </Col>
          <Col span={24} style={{ marginTop: 8 }}>
            <Space>
              <Text strong>Result:</Text>
              <Tag color={result.passed ? 'green' : 'red'}>
                {result.passed ? 'PASSED' : 'FAILED'}
              </Tag>
            </Space>
            {result.remarks && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">Remarks:</Text> {result.remarks}
              </div>
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  const getTestTypeLabel = (testType: string) => {
    const labels: { [key: string]: string } = {
      UAT: 'IT Officer UAT Testing',
      Requestor_Confirmation: 'Requestor Test Confirmation',
      QA_Validation: 'QA Officer Validation',
    };
    return labels[testType] || testType;
  };

  const getTestTypeColor = (testType: string) => {
    const colors: { [key: string]: string } = {
      UAT: 'blue',
      Requestor_Confirmation: 'orange',
      QA_Validation: 'purple',
    };
    return colors[testType] || 'default';
  };

  return (
    <div>
      <Title level={5}>Testing Results History</Title>
      <Collapse defaultActiveKey={[testingResults.length - 1]} accordion>
        {testingResults.map((testing, idx) => (
          <Panel
            key={idx}
            header={
              <Space>
                <Tag color={getTestTypeColor(testing.testType)}>
                  {getTestTypeLabel(testing.testType)}
                </Tag>
                <Tag color={testing.passed ? 'green' : 'red'}>
                  {testing.passed ? 'Overall: PASSED' : 'Overall: FAILED'}
                </Tag>
                {testing.createdAt && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <CalendarOutlined /> {dayjs(testing.createdAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                )}
              </Space>
            }
          >
            {testing.notes && (
              <Alert
                message="Testing Notes"
                description={testing.notes}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <div>
              {testing.testResults && testing.testResults.length > 0 ? (
                testing.testResults.map((result: any, rIdx: number) => renderTestResult(result, rIdx))
              ) : (
                <Text type="secondary">No detailed test results available.</Text>
              )}
            </div>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
};

export default TestingResultsView;
