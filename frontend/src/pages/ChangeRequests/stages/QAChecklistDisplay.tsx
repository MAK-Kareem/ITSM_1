import React from 'react';
import { Card, Tag, Typography, Divider, Row, Col, Space, Alert, Table } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import TestingChecklistDisplay from './TestingChecklistDisplay';

const { Text, Title } = Typography;

interface Props {
  checklistData: any[];
  notes?: string;
  validated?: boolean;
}

const QAChecklistDisplay: React.FC<Props> = ({ checklistData, notes, validated }) => {
  if (!checklistData || checklistData.length === 0) {
    return (
      <Alert
        message="No QA checklist data available"
        type="info"
        showIcon
      />
    );
  }

  const extractChecklistJson = (remarks: string): string | null => {
    if (!remarks) return null;

    // Try to extract JSON from within the remarks
    // QA saves it as: "Passed: X, Failed: Y, Not Tested: Z. Details: {JSON}"
    const detailsMatch = remarks.match(/Details:\s*(\{[\s\S]*\})$/);
    if (detailsMatch) {
      try {
        const jsonStr = detailsMatch[1];
        const parsed = JSON.parse(jsonStr);
        if (parsed.schemes && parsed.additionalChecks) {
          return jsonStr;
        }
      } catch (e) {
        // Not valid JSON
      }
    }

    return null;
  };

  // Check if any item contains POS & Switch Testing data
  const posTestingItem = checklistData.find(
    (item) => item.checkItem === 'POS & Switch Testing Validation'
  );

  const checklistJson = posTestingItem ? extractChecklistJson(posTestingItem.remarks) : null;

  // If we have POS testing data, render it beautifully
  if (checklistJson) {
    return (
      <div>
        <Alert
          message={validated ? 'QA Validation Passed' : 'QA Validation Has Issues'}
          type={validated ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <TestingChecklistDisplay checklistJson={checklistJson} />

        {notes && (
          <Card size="small" title="QA Officer Notes" style={{ marginTop: 16 }}>
            <Text>{notes}</Text>
          </Card>
        )}
      </div>
    );
  }

  // Fallback to standard table display for non-POS checklist items
  const columns = [
    {
      title: 'Check Item',
      dataIndex: 'checkItem',
      key: 'checkItem',
      width: '60%',
    },
    {
      title: 'Status',
      dataIndex: 'checked',
      key: 'checked',
      width: '15%',
      render: (checked: boolean) =>
        checked ? (
          <Tag color="green">
            <CheckCircleOutlined /> PASS
          </Tag>
        ) : (
          <Tag color="red">
            <CloseCircleOutlined /> FAIL
          </Tag>
        ),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: '25%',
      render: (remarks: string) => {
        // Don't display the full JSON in remarks column
        if (remarks && remarks.includes('Details:')) {
          const summary = remarks.split('Details:')[0].trim();
          return summary || '-';
        }
        return remarks || '-';
      },
    },
  ];

  return (
    <div>
      <Table
        dataSource={checklistData}
        columns={columns}
        rowKey="checkItem"
        pagination={false}
        size="small"
      />
      {notes && (
        <div style={{ marginTop: 16 }}>
          <strong>Notes:</strong> {notes}
        </div>
      )}
    </div>
  );
};

export default QAChecklistDisplay;
