import React, { useState, useRef } from 'react';
import { Button, Space, Dropdown, Menu, message, Modal, Spin } from 'antd';
import {
  FilePdfOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { ChangeRequest, CR_STAGES } from '../../types/change-request.types';
import dayjs from 'dayjs';

interface Props {
  cr: ChangeRequest;
}

const CRExportPrint: React.FC<Props> = ({ cr }) => {
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const getStageName = (stage: number): string => {
    if (cr.currentStatus === 'Completed') return 'Completed';
    const stageInfo = CR_STAGES.find((s) => s.stage === stage);
    return stageInfo ? stageInfo.name : `Stage ${stage}`;
  };

  const generatePDFContent = (): string => {
    const approvalRows = cr.approvals
      ?.map(
        (approval) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Stage ${approval.stage}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${approval.approver?.firstName || ''} ${approval.approver?.lastName || ''}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${approval.approverRole}</td>
          <td style="padding: 8px; border: 1px solid #ddd; color: ${approval.status === 'approved' ? 'green' : 'red'}; font-weight: bold;">
            ${approval.status.toUpperCase()}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">${dayjs(approval.approvedAt).format('DD/MM/YYYY HH:mm')}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${approval.signatureFilePath 
              ? `<img src="${approval.signatureFilePath}" alt="Signature" style="max-height: 50px; max-width: 120px;" />`
              : '-'
            }
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">${approval.comments || '-'}</td>
        </tr>
      `
      )
      .join('') || '<tr><td colspan="7" style="padding: 8px; text-align: center;">No approvals recorded</td></tr>';

    const deploymentTeamRows = cr.deploymentTeam
      ?.map(
        (member) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${member.memberName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${member.designation || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${member.contact || '-'}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${member.role}</td>
        </tr>
      `
      )
      .join('') || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Change Request - ${cr.crNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1890ff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #1890ff;
            margin: 0;
            font-size: 28px;
          }
          .header .cr-number {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-top: 10px;
          }
          .header .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 10px;
          }
          .status-completed { background: #52c41a; color: white; }
          .status-rejected { background: #ff4d4f; color: white; }
          .status-pending { background: #faad14; color: white; }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            background: #f0f5ff;
            padding: 10px 15px;
            font-size: 16px;
            font-weight: bold;
            color: #1890ff;
            border-left: 4px solid #1890ff;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-item {
            padding: 8px;
            background: #fafafa;
            border-radius: 4px;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
          }
          .info-value {
            margin-top: 4px;
            font-size: 14px;
          }
          .full-width {
            grid-column: 1 / -1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background: #1890ff;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-size: 12px;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
            font-size: 12px;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .priority-low { color: #52c41a; font-weight: bold; }
          .priority-medium { color: #1890ff; font-weight: bold; }
          .priority-high { color: #fa8c16; font-weight: bold; }
          .priority-critical { color: #ff4d4f; font-weight: bold; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #888;
          }
          .text-block {
            background: #fafafa;
            padding: 12px;
            border-radius: 4px;
            white-space: pre-wrap;
            font-size: 13px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CHANGE REQUEST</h1>
          <div class="cr-number">${cr.crNumber}</div>
          <div class="status ${
            cr.currentStatus === 'Completed'
              ? 'status-completed'
              : cr.currentStatus === 'Rejected'
              ? 'status-rejected'
              : 'status-pending'
          }">
            ${cr.currentStatus}
          </div>
        </div>

        <div class="section">
          <div class="section-title">BASIC INFORMATION</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Request Date</div>
              <div class="info-value">${dayjs(cr.requestDate).format('DD/MM/YYYY HH:mm')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Current Stage</div>
              <div class="info-value">${cr.currentStatus === 'Completed' ? 'Completed' : `Stage ${cr.currentStage}: ${getStageName(cr.currentStage)}`}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Requested By</div>
              <div class="info-value">${cr.requester ? `${cr.requester.firstName} ${cr.requester.lastName}` : `User ID: ${cr.requestedBy}`}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Line Manager</div>
              <div class="info-value">${cr.lineManager ? `${cr.lineManager.firstName} ${cr.lineManager.lastName}` : `User ID: ${cr.lineManagerId}`}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Business Priority</div>
              <div class="info-value priority-${cr.businessPriority.toLowerCase()}">${cr.businessPriority}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Created At</div>
              <div class="info-value">${dayjs(cr.createdAt).format('DD/MM/YYYY HH:mm')}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Purpose of Change</div>
              <div class="info-value">${cr.purposeOfChange}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Description of Change</div>
              <div class="text-block">${cr.descriptionOfChange}</div>
            </div>
            ${
              cr.priorityJustification
                ? `
            <div class="info-item full-width">
              <div class="info-label">Priority Justification</div>
              <div class="text-block">${cr.priorityJustification}</div>
            </div>
            `
                : ''
            }
            ${
              cr.requestorSignature
                ? `
            <div class="info-item full-width">
              <div class="info-label">Requestor Signature</div>
              <div style="background: #fafafa; padding: 12px; border-radius: 4px; text-align: center;">
                <img src="${cr.requestorSignature}" alt="Requestor Signature" style="max-height: 80px; max-width: 200px;" />
              </div>
            </div>
            `
                : ''
            }
          </div>
        </div>

        ${
          cr.category
            ? `
        <div class="section">
          <div class="section-title">IT OFFICER ASSESSMENT</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Category</div>
              <div class="info-value">${cr.category}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Subcategory</div>
              <div class="info-value">${cr.subcategory}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Impacts Client Service</div>
              <div class="info-value" style="color: ${cr.impactsClientService ? '#ff4d4f' : '#52c41a'}; font-weight: bold;">
                ${cr.impactsClientService ? 'YES' : 'NO'}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Expected Downtime</div>
              <div class="info-value">${cr.expectedDowntimeValue} ${cr.expectedDowntimeUnit}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Cost Involved</div>
              <div class="info-value">${cr.costInvolved ? `${cr.costInvolved} BHD` : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Planned Date & Time</div>
              <div class="info-value">${cr.plannedDatetime ? dayjs(cr.plannedDatetime).format('DD/MM/YYYY HH:mm') : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Last Backup Date</div>
              <div class="info-value">${cr.lastBackupDate ? dayjs(cr.lastBackupDate).format('DD/MM/YYYY HH:mm') : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Assigned IT Officer</div>
              <div class="info-value">${cr.assignedITOfficer ? `${cr.assignedITOfficer.firstName} ${cr.assignedITOfficer.lastName}` : 'N/A'}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Impact Assessment</div>
              <div class="text-block">${cr.impactAssessment || 'N/A'}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Backout/Rollback Plan</div>
              <div class="text-block">${cr.backoutRollbackPlan || 'N/A'}</div>
            </div>
            ${
              cr.itoSignature
                ? `
            <div class="info-item full-width">
              <div class="info-label">IT Officer Signature</div>
              <div style="background: #fafafa; padding: 12px; border-radius: 4px; text-align: center;">
                <img src="${cr.itoSignature}" alt="IT Officer Signature" style="max-height: 80px; max-width: 200px;" />
              </div>
            </div>
            `
                : ''
            }
          </div>
        </div>
        `
            : ''
        }

        ${
          cr.deploymentTeam && cr.deploymentTeam.length > 0
            ? `
        <div class="section">
          <div class="section-title">DEPLOYMENT TEAM</div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Contact</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              ${deploymentTeamRows}
            </tbody>
          </table>
        </div>
        `
            : ''
        }

        <div class="section">
          <div class="section-title">APPROVAL HISTORY</div>
          <table>
            <thead>
              <tr>
                <th>Stage</th>
                <th>Approver</th>
                <th>Role</th>
                <th>Decision</th>
                <th>Date & Time</th>
                <th>Signature</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              ${approvalRows}
            </tbody>
          </table>
        </div>

        ${
          cr.currentStatus === 'Completed' && cr.nocClosureNotes
            ? `
        <div class="section">
          <div class="section-title">NOC CLOSURE DETAILS</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Incident Triggered</div>
              <div class="info-value" style="color: ${cr.incidentTriggered ? '#ff4d4f' : '#52c41a'}; font-weight: bold;">
                ${cr.incidentTriggered ? 'YES' : 'NO'}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Rollback Triggered</div>
              <div class="info-value" style="color: ${cr.rollbackTriggered ? '#ff4d4f' : '#52c41a'}; font-weight: bold;">
                ${cr.rollbackTriggered ? 'YES' : 'NO'}
              </div>
            </div>
            ${
              cr.incidentTriggered
                ? `
            <div class="info-item full-width">
              <div class="info-label">Incident Details</div>
              <div class="text-block">${cr.incidentDetails || 'N/A'}</div>
            </div>
            `
                : ''
            }
            ${
              cr.rollbackTriggered
                ? `
            <div class="info-item full-width">
              <div class="info-label">Rollback Details</div>
              <div class="text-block">${cr.rollbackDetails || 'N/A'}</div>
            </div>
            `
                : ''
            }
            <div class="info-item full-width">
              <div class="info-label">Closure Notes</div>
              <div class="text-block">${cr.nocClosureNotes}</div>
            </div>
            ${
              cr.nocClosureJustification
                ? `
            <div class="info-item full-width">
              <div class="info-label">Early Closure Justification</div>
              <div class="text-block">${cr.nocClosureJustification}</div>
            </div>
            `
                : ''
            }
            <div class="info-item">
              <div class="info-label">Completed At</div>
              <div class="info-value">${cr.completedAt ? dayjs(cr.completedAt).format('DD/MM/YYYY HH:mm') : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">NOC Officer Signature</div>
              <div style="background: #fafafa; padding: 12px; border-radius: 4px; text-align: center;">
                ${
                  // Check in approvals for NOC signature or use nocSignature field
                  cr.approvals?.find(a => a.stage === 10 && a.approverRole === 'noc')?.signatureFilePath
                    ? `<img src="${cr.approvals.find(a => a.stage === 10 && a.approverRole === 'noc')?.signatureFilePath}" alt="NOC Signature" style="max-height: 80px; max-width: 200px;" />`
                    : 'No signature available'
                }
              </div>
            </div>
          </div>
        </div>
        `
            : ''
        }

        <div class="footer">
          <p>Generated on ${dayjs().format('DD/MM/YYYY HH:mm:ss')} | EazyPay Management System</p>
          <p>This is an official document. Please keep for your records.</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const content = generatePDFContent();

      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        message.error('Please allow popups for PDF export');
        setLoading(false);
        return;
      }

      printWindow.document.write(content);
      printWindow.document.close();

      // Wait for content to load then trigger print/save as PDF
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setLoading(false);
        }, 500);
      };

      message.success('PDF export dialog opened. Choose "Save as PDF" to download.');
    } catch (error) {
      console.error('PDF export error:', error);
      message.error('Failed to export PDF');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = generatePDFContent();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Please allow popups for printing');
      return;
    }

    printWindow.document.write(content);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const menu = (
    <Menu>
      <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={handleExportPDF}>
        Export as PDF
      </Menu.Item>
      <Menu.Item key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
        Print
      </Menu.Item>
      <Menu.Item key="preview" icon={<EyeOutlined />} onClick={handlePreview}>
        Preview
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Dropdown overlay={menu} trigger={['click']}>
        <Button icon={<DownloadOutlined />} loading={loading}>
          Export / Print
        </Button>
      </Dropdown>

      <Modal
        title={`Preview: ${cr.crNumber}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>,
          <Button key="pdf" type="primary" icon={<FilePdfOutlined />} onClick={handleExportPDF} loading={loading}>
            Export PDF
          </Button>,
        ]}
      >
        <div
          style={{
            maxHeight: '70vh',
            overflow: 'auto',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
          }}
        >
          <iframe
            srcDoc={generatePDFContent()}
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="CR Preview"
          />
        </div>
      </Modal>
    </>
  );
};

export default CRExportPrint;
