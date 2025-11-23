import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Steps,
  Spin,
  message,
  Tabs,
  Timeline,
  Alert,
  Divider,
  Row,
  Col,
  Table,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  FileTextOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  ChangeRequest,
  CRApproval,
  CRHistory,
  CRDeploymentTeamMember,
  CRTestingResult,
  CRQAChecklist,
  CR_STAGES,
  CR_STATUS_COLORS,
  CR_PRIORITY_COLORS,
  getStageName,
  getStageDescription,
} from '../../types/change-request.types';
import changeRequestService from '../../services/change-request.service';
import authService from '../../services/auth.service';
import dayjs from 'dayjs';

// Import stage-specific components
import LineManagerApprovalForm from './stages/LineManagerApprovalForm';
import HeadOfITApprovalForm from './stages/HeadOfITApprovalForm';
import ITOfficerAssessmentForm from './stages/ITOfficerAssessmentForm';
import RequestorTestConfirmationForm from './stages/RequestorTestConfirmationForm';
import QAOfficerValidationForm from './stages/QAOfficerValidationForm';
import ProductionApprovalForm from './stages/ProductionApprovalForm';
import InfoSecApprovalForm from './stages/InfoSecApprovalForm';
import DeploymentCompletionForm from './stages/DeploymentCompletionForm';
import NOCClosureForm from './stages/NOCClosureForm';
import TestingResultsView from './stages/TestingResultsView';
import QAChecklistDisplay from './stages/QAChecklistDisplay';
import ApprovalHistoryView from './stages/ApprovalHistoryView';
import CRExportPrint from './CRExportPrint';
import EditChangeRequestModal from './components/EditChangeRequestModal';

const { TabPane } = Tabs;

const ChangeRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [cr, setCr] = useState<ChangeRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CRHistory[]>([]);
  const [approvals, setApprovals] = useState<CRApproval[]>([]);
  const [deploymentTeam, setDeploymentTeam] = useState<CRDeploymentTeamMember[]>([]);
  const [testingResults, setTestingResults] = useState<CRTestingResult[]>([]);
  const [qaChecklists, setQAChecklists] = useState<CRQAChecklist[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    if (id) {
      loadCRData();
      checkPermissions();
    }
  }, [id]);

  const loadCRData = async () => {
    setLoading(true);
    try {
      // Load CR data first
      const crData = await changeRequestService.getById(Number(id));
      setCr(crData);

      // Load history separately
      try {
        const historyData = await changeRequestService.getHistory(Number(id));
        setHistory(historyData);
      } catch (err) {
        console.error('Failed to load history:', err);
      }

      // Load approvals separately
      try {
        const approvalsData = await changeRequestService.getApprovals(Number(id));
        setApprovals(approvalsData);
      } catch (err) {
        console.error('Failed to load approvals:', err);
        // Fallback to approvals from CR data if available
        if (crData.approvals) {
          setApprovals(crData.approvals);
        }
      }

      // Load additional data from CR object if available
      if (crData.deploymentTeam) {
        setDeploymentTeam(crData.deploymentTeam);
      }
      if (crData.testingResults) {
        setTestingResults(crData.testingResults);
      }
      if (crData.qaChecklists) {
        setQAChecklists(crData.qaChecklists);
      }
    } catch (error) {
      message.error('Failed to load change request');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    if (!id) return;
    try {
      const permissions = await changeRequestService.canEditOrDelete(Number(id));
      setCanEdit(permissions.canEdit);
      setCanDelete(permissions.canDelete);
    } catch (error) {
      setCanEdit(false);
      setCanDelete(false);
    }
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleDelete = () => {
    if (!cr) return;

    Modal.confirm({
      title: 'Delete Change Request',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to delete <strong>{cr.crNumber}</strong>?</p>
          <p style={{ color: '#ff4d4f' }}>This action cannot be undone.</p>
        </div>
      ),
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await changeRequestService.delete(cr.id);
          message.success('Change request deleted successfully');
          navigate('/change-requests');
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to delete change request');
        }
      },
    });
  };

  const handleEditSuccess = () => {
    setEditModalVisible(false);
    loadCRData();
    checkPermissions();
  };

  const getCurrentStageName = (stage: number): string => {
    if (!cr) return `Stage ${stage}`;
    return getStageName(stage, cr.currentStatus);
  };

  const canUserActOnCurrentStage = (): boolean => {
    if (!cr || !currentUser) return false;

    const stageRoleMap: Record<number, string[]> = {
      2: ['line_manager'],
      3: ['head_of_it'],
      4: ['it_officer'],
      5: ['requestor'],
      6: ['qa_officer'],
      7: ['head_of_it'],
      8: ['head_of_infosec'],
      9: ['it_officer'],
      10: ['noc'],
    };

    const allowedRoles = stageRoleMap[cr.currentStage];
    if (!allowedRoles) return false;

    // Helper to check if user has any of the allowed roles (supports multi-role)
    const userHasAnyRole = (roles: string[]): boolean => {
      // Check if user has roles array (multi-role support)
      if ((currentUser as any).roles && Array.isArray((currentUser as any).roles)) {
        return roles.some(role => (currentUser as any).roles.includes(role));
      }
      // Fallback to single role check
      return roles.includes(currentUser.role);
    };

    // Special check for requestor stage
    if (cr.currentStage === 5) {
      return cr.requestedBy === currentUser.id;
    }

    // Special check for line manager - must be THE line manager for this CR
    if (cr.currentStage === 2) {
      return userHasAnyRole(allowedRoles) && cr.lineManagerId === currentUser.id;
    }

    return userHasAnyRole(allowedRoles);
  };

  const renderStageSpecificForm = () => {
    if (!cr || !canUserActOnCurrentStage()) return null;

    switch (cr.currentStage) {
      case 2:
        return <LineManagerApprovalForm cr={cr} onSuccess={loadCRData} />;
      case 3:
        return <HeadOfITApprovalForm cr={cr} onSuccess={loadCRData} />;
      case 4:
        return <ITOfficerAssessmentForm cr={cr} onSuccess={loadCRData} />;
      case 5:
        return <RequestorTestConfirmationForm cr={cr} testingResults={testingResults} onSuccess={loadCRData} />;
      case 6:
        return <QAOfficerValidationForm cr={cr} onSuccess={loadCRData} />;
      case 7:
        return <ProductionApprovalForm cr={cr} onSuccess={loadCRData} />;
      case 8:
        return <InfoSecApprovalForm cr={cr} onSuccess={loadCRData} />;
      case 9:
        return <DeploymentCompletionForm cr={cr} onSuccess={loadCRData} />;
      case 10:
        return <NOCClosureForm cr={cr} onSuccess={loadCRData} />;
      default:
        return null;
    }
  };

  const renderBasicInfo = () => {
    if (!cr) return null;

    return (
      <Card title="Change Request Information" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="CR Number" span={1}>
            <strong>{cr.crNumber}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            <Tag color={CR_STATUS_COLORS[cr.currentStatus] || 'default'}>
              {cr.currentStatus}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Current Stage" span={1}>
            <Tag color={cr.currentStatus === 'Completed' ? 'green' : 'blue'}>
              {cr.currentStatus === 'Completed'
                ? 'Completed'
                : `Stage ${cr.currentStage}: ${getCurrentStageName(cr.currentStage)}`}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Requested By" span={1}>
            {cr.requester
              ? `${cr.requester.firstName} ${cr.requester.lastName}`
              : `User ID: ${cr.requestedBy}`}
          </Descriptions.Item>
          <Descriptions.Item label="Request Date" span={1}>
            {dayjs(cr.requestDate).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Business Priority" span={1}>
            <Tag color={CR_PRIORITY_COLORS[cr.businessPriority] || 'default'}>
              {cr.businessPriority}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Line Manager" span={1}>
            {cr.lineManager
              ? `${cr.lineManager.firstName} ${cr.lineManager.lastName}`
              : `User ID: ${cr.lineManagerId}`}
          </Descriptions.Item>
          <Descriptions.Item label="Created At" span={1}>
            {dayjs(cr.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated" span={1}>
            {dayjs(cr.updatedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>

          <Descriptions.Item label="Purpose of Change" span={3}>
            {cr.purposeOfChange}
          </Descriptions.Item>

          <Descriptions.Item label="Description of Change" span={3}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{cr.descriptionOfChange}</div>
          </Descriptions.Item>

          {cr.priorityJustification && (
            <Descriptions.Item label="Priority Justification" span={3}>
              {cr.priorityJustification}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    );
  };

  const renderITOfficerInfo = () => {
    if (!cr || !cr.category) return null;

    return (
      <Card title="IT Officer Assessment" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Category">{cr.category}</Descriptions.Item>
          <Descriptions.Item label="Subcategory">{cr.subcategory}</Descriptions.Item>
          <Descriptions.Item label="Impacts Client Service">
            <Tag color={cr.impactsClientService ? 'red' : 'green'}>
              {cr.impactsClientService ? 'YES' : 'NO'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Expected Downtime">
            {cr.expectedDowntimeValue} {cr.expectedDowntimeUnit}
          </Descriptions.Item>
          <Descriptions.Item label="Cost Involved">
            {cr.costInvolved ? `${cr.costInvolved} BHD` : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Planned Date & Time">
            {cr.plannedDatetime ? dayjs(cr.plannedDatetime).format('YYYY-MM-DD HH:mm') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Last Backup Date">
            {cr.lastBackupDate ? dayjs(cr.lastBackupDate).format('YYYY-MM-DD HH:mm') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Impact Assessment" span={2}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{cr.impactAssessment}</div>
          </Descriptions.Item>
          <Descriptions.Item label="Backout/Rollback Plan" span={2}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{cr.backoutRollbackPlan}</div>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  const renderDeploymentTeam = () => {
    if (deploymentTeam.length === 0) return null;

    const columns = [
      { title: 'Name', dataIndex: 'memberName', key: 'memberName' },
      { title: 'Designation', dataIndex: 'designation', key: 'designation' },
      { title: 'Contact', dataIndex: 'contact', key: 'contact' },
      { title: 'Role', dataIndex: 'role', key: 'role' },
    ];

    return (
      <Card title="Deployment Team" style={{ marginBottom: 16 }}>
        <Table
          dataSource={deploymentTeam}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  const renderCRHistory = () => {
    return (
      <Card title="Change Request History">
        <Timeline mode="left">
          {history.map((entry) => (
            <Timeline.Item
              key={entry.id}
              color={entry.action === 'rejected' ? 'red' : 'blue'}
              label={dayjs(entry.createdAt).format('YYYY-MM-DD HH:mm')}
            >
              <p>
                <strong>{entry.action.toUpperCase()}</strong>
              </p>
              {entry.fromStage && entry.toStage && (
                <p>
                  Stage: {entry.fromStage} → {entry.toStage}
                </p>
              )}
              {entry.fromStatus && entry.toStatus && (
                <p>
                  Status: {entry.fromStatus} → {entry.toStatus}
                </p>
              )}
              <p>
                By: {entry.user?.firstName} {entry.user?.lastName}
              </p>
              {entry.notes && <p>Notes: {entry.notes}</p>}
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    );
  };

  const renderWorkflowProgress = () => {
    if (!cr) return null;

    const isCompleted = cr.currentStatus === 'Completed';

    return (
      <Card title="Workflow Progress" style={{ marginBottom: 16 }}>
        <Steps
          current={isCompleted ? CR_STAGES.length : cr.currentStage - 1}
          status={cr.currentStatus === 'Rejected' ? 'error' : isCompleted ? 'finish' : 'process'}
          size="small"
          direction="vertical"
          items={CR_STAGES.map((stage) => ({
            title: stage.name,
            description: (
              <div>
                <div>{stage.description}</div>
                {!isCompleted && cr.currentStage === stage.stage && (
                  <Tag color="processing" style={{ marginTop: 4 }}>
                    Current Stage
                  </Tag>
                )}
                {(isCompleted || cr.currentStage > stage.stage) && (
                  <Tag color="success" style={{ marginTop: 4 }}>
                    Completed
                  </Tag>
                )}
              </div>
            ),
          }))}
        />
        {isCompleted && (
          <Alert
            message="All Stages Completed"
            description={`CR closed on ${dayjs(cr.completedAt).format('DD/MM/YYYY HH:mm')}`}
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    );
  };

  if (loading || !cr) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/change-requests')}>
            Back to List
          </Button>
          <CRExportPrint cr={cr} />
        </Space>

        {/* Edit and Delete buttons */}
        <Space>
          {canEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              Edit CR
            </Button>
          )}
          {canDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete CR
            </Button>
          )}
        </Space>
      </Space>

      {cr.currentStatus === 'Rejected' && (
        <Alert
          message="Change Request Rejected"
          description="This change request has been rejected. Please review the approval history for details."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {cr.currentStatus === 'Completed' && (
        <Alert
          message="Change Request Completed"
          description="This change request has been successfully completed and closed."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {canUserActOnCurrentStage() && cr.currentStatus !== 'Rejected' && cr.currentStatus !== 'Completed' && (
        <Alert
          message="Action Required"
          description={`You have pending action on this CR at Stage ${cr.currentStage}: ${getCurrentStageName(cr.currentStage)}`}
          type="warning"
          showIcon
          style={{ 
            marginBottom: 16,
            backgroundColor: '#ffc53d',
            border: '1px solid #faad14',
            padding: '8px 16px',
            minHeight: 'auto'
          }}
        />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              Details
            </span>
          }
          key="details"
        >
          <Row gutter={16}>
            <Col xs={24} lg={18}>
              {renderBasicInfo()}
              {renderITOfficerInfo()}
              {renderDeploymentTeam()}

              {/* Stage-specific action form */}
              {canUserActOnCurrentStage() &&
                cr.currentStatus !== 'Rejected' &&
                cr.currentStatus !== 'Completed' && (
                  <Card
                    title={`Stage ${cr.currentStage} Action: ${getCurrentStageName(cr.currentStage)}`}
                    style={{ marginBottom: 16 }}
                    headStyle={{ 
                      backgroundColor: '#ffc53d',
                      border: '1px solid #faad14',
                      padding: '12px 16px',
                      fontWeight: 600
                    }}
                  >
                    {renderStageSpecificForm()}
                  </Card>
                )}
            </Col>
            <Col xs={24} lg={6}>
              {renderWorkflowProgress()}
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SafetyCertificateOutlined />
              Approvals
            </span>
          }
          key="approvals"
        >
          <ApprovalHistoryView approvals={approvals} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              History
            </span>
          }
          key="history"
        >
          {renderCRHistory()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <ExperimentOutlined />
              Testing
            </span>
          }
          key="testing"
        >
          <TestingResultsView testingResults={testingResults} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              Team & QA
            </span>
          }
          key="team"
        >
          {renderDeploymentTeam()}
          {qaChecklists.length > 0 ? (
            qaChecklists.map((checklist) => (
              <Card
                key={checklist.id}
                title={
                  <Space>
                    <span>QA Validation</span>
                    <Tag color={checklist.validated ? 'green' : 'orange'}>
                      {checklist.validated ? 'VALIDATED' : 'PENDING'}
                    </Tag>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {dayjs(checklist.createdAt).format('DD/MM/YYYY HH:mm')}
                    </span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <QAChecklistDisplay
                  checklistData={checklist.checklistData}
                  notes={checklist.notes}
                  validated={checklist.validated}
                />
              </Card>
            ))
          ) : (
            <Alert message="No QA checklists available yet" type="info" showIcon />
          )}
        </TabPane>
      </Tabs>

      {/* Edit Modal */}
      {cr && (
        <EditChangeRequestModal
          visible={editModalVisible}
          cr={cr}
          onClose={() => setEditModalVisible(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ChangeRequestDetailPage;
