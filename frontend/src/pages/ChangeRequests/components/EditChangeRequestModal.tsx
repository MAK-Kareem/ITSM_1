import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Radio, Space } from 'antd';
import { ChangeRequest, CR_PRIORITIES } from '../../../types/change-request.types';
import changeRequestService from '../../../services/change-request.service';
import userService from '../../../services/user.service';
import authService from '../../../services/auth.service';
import { User } from '../../../types';

const { TextArea } = Input;
const { Option } = Select;

interface Props {
  visible: boolean;
  cr: ChangeRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const EditChangeRequestModal: React.FC<Props> = ({ visible, cr, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string>(cr.businessPriority);
  const currentUser = authService.getCurrentUser();

  // Determine which form to show based on user role and CR stage
  const getEditMode = (): 'requestor' | 'line_manager' | 'head_of_it' => {
    if (!currentUser) return 'requestor';
    
    const userRoles: string[] = (currentUser as any).roles || [currentUser.role];
    
    // Stage 2: Requestor can edit
    if (cr.currentStage === 2 && cr.requestedBy === currentUser.id) {
      return 'requestor';
    }
    
    // Stage 3: Line Manager can edit their approval
    if (cr.currentStage === 3 && userRoles.includes('line_manager')) {
      return 'line_manager';
    }
    
    // Stage 4+: Head of IT can edit
    if (cr.currentStage >= 4 && userRoles.includes('head_of_it')) {
      return 'head_of_it';
    }
    
    return 'requestor';
  };

  const editMode = getEditMode();

  useEffect(() => {
    if (visible) {
      loadUsers();
      // Set initial form values based on edit mode
      if (editMode === 'requestor') {
        form.setFieldsValue({
          purposeOfChange: cr.purposeOfChange,
          descriptionOfChange: cr.descriptionOfChange,
          lineManagerId: cr.lineManagerId,
          businessPriority: cr.businessPriority,
          priorityJustification: cr.priorityJustification,
        });
      } else {
        // For LM and HoIT, we'll let them re-enter their approval decision
        form.setFieldsValue({
          decision: 'approve',
          comments: '',
        });
      }
      setSelectedPriority(cr.businessPriority);
    }
  }, [visible, cr, form, editMode]);

  const loadUsers = async () => {
    try {
      const userList = await userService.getAll();
      setUsers(userList);
    } catch (error) {
      message.error('Failed to load users');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editMode === 'requestor') {
        // Requestor editing basic CR fields
        if (values.businessPriority === 'High' && !values.priorityJustification) {
          message.error('Priority justification is required for High priority');
          setLoading(false);
          return;
        }

        await changeRequestService.update(cr.id, {
          purposeOfChange: values.purposeOfChange,
          descriptionOfChange: values.descriptionOfChange,
          lineManagerId: values.lineManagerId,
          businessPriority: values.businessPriority,
          priorityJustification: values.priorityJustification || null,
        });

        message.success('Change Request updated successfully!');
      } else {
        // REQUIREMENT #4 & #8: LM or HoIT editing their approval decision
        if (values.decision === 'approve') {
          await changeRequestService.approve(cr.id, {
            comments: values.comments || 'Updated approval',
          });
          message.success('Approval updated successfully!');
        } else {
          await changeRequestService.reject(cr.id, {
            reason: values.comments || 'Rejected',
          });
          message.success('Decision updated to Rejected!');
        }
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = (value: string) => {
    setSelectedPriority(value);
    if (value !== 'High') {
      form.setFieldsValue({ priorityJustification: null });
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const renderRequestorForm = () => (
    <>
      <Form.Item
        name="purposeOfChange"
        label="Purpose of Change"
        rules={[{ required: true, message: 'Please enter the purpose of change' }]}
      >
        <TextArea placeholder="Describe WHY this change is needed" rows={4} maxLength={1000} showCount />
      </Form.Item>

      <Form.Item
        name="descriptionOfChange"
        label="Description of Change"
        rules={[{ required: true, message: 'Please enter the description' }]}
      >
        <TextArea placeholder="Describe WHAT will be changed" rows={6} maxLength={2000} showCount />
      </Form.Item>

      <Form.Item
        name="lineManagerId"
        label="Line Manager"
        rules={[{ required: true, message: 'Please select Line Manager' }]}
      >
        <Select
          placeholder="Select Line Manager"
          showSearch
          filterOption={(input, option) =>
            (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        >
          {users.map((user) => (
            <Option key={user.id} value={user.id}>
              {user.firstName} {user.lastName} ({user.email})
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="businessPriority"
        label="Business Priority"
        rules={[{ required: true, message: 'Please select priority' }]}
      >
        <Select placeholder="Select priority" onChange={handlePriorityChange}>
          {CR_PRIORITIES.map((priority) => (
            <Option key={priority} value={priority}>
              {priority}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {selectedPriority === 'High' && (
        <Form.Item
          name="priorityJustification"
          label="Priority Justification (Required for High Priority)"
          rules={[{ required: true, message: 'Justification required' }]}
        >
          <TextArea placeholder="Explain why High priority is needed" rows={3} maxLength={500} showCount />
        </Form.Item>
      )}
    </>
  );

  const renderApprovalForm = () => (
    <>
      <Form.Item
        name="decision"
        label="Decision"
        rules={[{ required: true, message: 'Please select a decision' }]}
      >
        <Radio.Group>
          <Space direction="vertical">
            <Radio value="approve">Approve</Radio>
            <Radio value="reject">Reject</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="comments"
        label="Comments"
        rules={[{ required: true, message: 'Please provide comments' }]}
      >
        <TextArea 
          placeholder="Enter your comments or reason for decision" 
          rows={4} 
          maxLength={500} 
          showCount 
        />
      </Form.Item>
    </>
  );

  const getModalTitle = () => {
    if (editMode === 'requestor') {
      return `Edit Change Request - ${cr.crNumber}`;
    } else if (editMode === 'line_manager') {
      return `Edit Line Manager Approval - ${cr.crNumber}`;
    } else {
      return `Edit Head of IT Decision - ${cr.crNumber}`;
    }
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {editMode === 'requestor' ? renderRequestorForm() : renderApprovalForm()}

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={handleCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditChangeRequestModal;
