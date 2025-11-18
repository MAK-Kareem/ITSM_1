import React, { useEffect, useState, useMemo, useContext } from 'react';
import { Table, Button, Space, Modal, message, Tag, Input, Typography, Select, Row, Col, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { Asset, User } from '../../types';
import assetService from '../../services/asset.service';
import userService from '../../services/user.service';
import AssetForm from './AssetForm';
import { ThemeContext } from '../../components/Layout/MainLayout';

const { Title } = Typography;
const { Option } = Select;

const AssetList: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = `${user.firstName} ${user.lastName}`;
      return acc;
    }, {} as Record<number, string>);
  }, [users]);

  useEffect(() => {
    loadAssets();
    loadUsers();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await assetService.getAll();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Failed to load assets');
      console.error('Error loading assets:', error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const userList = await userService.getAll();
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (error) {
      message.error('Failed to load user list');
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAsset(null);
    setModalVisible(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this asset?',
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          await assetService.delete(id);
          message.success('Asset deleted successfully');
          loadAssets();
        } catch (error) {
          message.error('Failed to delete asset');
        }
      },
    });
  };

  const handleFormSubmit = async () => {
    setModalVisible(false);
    loadAssets();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Active': 'green',
      'In Stock': 'cyan',
      'Maintenance': 'orange',
      'Retired': 'default',
      'Inactive': 'red',
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Hardware': 'blue',
      'Software': 'purple',
      'License': 'magenta',
      'Cloud Asset': 'cyan',
      'Furniture': 'orange',
      'Vehicle': 'geekblue',
      'Mobile Device': 'lime',
      'IoT Device': 'gold',
      'Digital Certificate': 'volcano',
      'Access Credential': 'red',
    };
    return colors[type] || 'default';
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (!asset) return false;

      const assignedUserName = asset.assignedTo ? (userMap[asset.assignedTo] || '') : '';
      const searchLower = searchText.toLowerCase();

      const assetValuesMatch = Object.values(asset).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });

      const userNameMatch = assignedUserName ? assignedUserName.toLowerCase().includes(searchLower) : false;

      const typeMatch = !typeFilter || asset.type === typeFilter;
      const statusMatch = !statusFilter || asset.status === statusFilter;

      return (assetValuesMatch || userNameMatch) && typeMatch && statusMatch;
    });
  }, [assets, searchText, typeFilter, statusFilter, userMap]);

  // Get unique asset types and statuses for filters
  const assetTypes = useMemo(() => Array.from(new Set(assets.map(a => a.type).filter(Boolean))), [assets]);
  const assetStatuses = useMemo(() => Array.from(new Set(assets.map(a => a.status).filter(Boolean))), [assets]);

  // Safe number formatter
  const formatCost = (cost: number | string | null | undefined): string => {
    if (!cost && cost !== 0) return '-';
    const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
    return isNaN(numCost) ? '-' : `$${numCost.toFixed(2)}`;
  };

  const columns = [
    {
      title: 'Asset Tag',
      dataIndex: 'assetTag',
      key: 'assetTag',
      width: 140,
      sorter: (a: Asset, b: Asset) => (a.assetTag || '').localeCompare(b.assetTag || ''),
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text || '-'}</span>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a: Asset, b: Asset) => (a.name || '').localeCompare(b.name || ''),
      render: (text: string) => text || '-'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => type ? <Tag color={getTypeColor(type)}>{type}</Tag> : '-',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string, record: Asset) => {
        // Show custom category if it exists and category is "Other"
        if (category === 'Other' && record.customCategory) {
          return `${category} (${record.customCategory})`;
        }
        return category || '-';
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => status ? <Tag color={getStatusColor(status)}>{status}</Tag> : '-',
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 150,
      render: (userId: number) => userMap[userId] || <Tag>Unassigned</Tag>,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 180,
      render: (text: string) => text || '-'
    },
    {
      title: 'Purchase Cost',
      dataIndex: 'purchaseCost',
      key: 'purchaseCost',
      width: 130,
      render: (cost: number | string) => formatCost(cost),
      sorter: (a: Asset, b: Asset) => {
        const costA = typeof a.purchaseCost === 'string' ? parseFloat(a.purchaseCost) : (a.purchaseCost || 0);
        const costB = typeof b.purchaseCost === 'string' ? parseFloat(b.purchaseCost) : (b.purchaseCost || 0);
        return costA - costB;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Asset) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Show loading spinner while users are loading
  if (usersLoading) {
    return (
      <div style={{
        padding: '2rem',
        minHeight: '100vh',
        backgroundColor: theme === 'light' ? '#F4F7FA' : '#16181D',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" tip="Loading assets..." />
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      minHeight: '100vh',
      backgroundColor: theme === 'light' ? '#F4F7FA' : '#16181D'
    }}>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={2}>Asset Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Asset
        </Button>
      </Space>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search assets..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="Filter by Type"
            style={{ width: '100%' }}
            onChange={(value) => setTypeFilter(value)}
            allowClear
            suffixIcon={<FilterOutlined />}
          >
            {assetTypes.map(type => (
              <Option key={type} value={type}>
                <Tag color={getTypeColor(type)}>{type}</Tag>
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="Filter by Status"
            style={{ width: '100%' }}
            onChange={(value) => setStatusFilter(value)}
            allowClear
            suffixIcon={<FilterOutlined />}
          >
            {assetStatuses.map(status => (
              <Option key={status} value={status}>
                <Tag color={getStatusColor(status)}>{status}</Tag>
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div style={{
            padding: '16px',
            background: theme === 'light' ? '#fff' : '#1E222D',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {filteredAssets.length}
            </div>
            <div style={{ color: theme === 'light' ? '#666' : '#a0a0a0' }}>Total Assets</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{
            padding: '16px',
            background: theme === 'light' ? '#fff' : '#1E222D',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              {filteredAssets.filter(a => a.status === 'Active').length}
            </div>
            <div style={{ color: theme === 'light' ? '#666' : '#a0a0a0' }}>Active</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{
            padding: '16px',
            background: theme === 'light' ? '#fff' : '#1E222D',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#13c2c2' }}>
              {filteredAssets.filter(a => a.status === 'In Stock').length}
            </div>
            <div style={{ color: theme === 'light' ? '#666' : '#a0a0a0' }}>In Stock</div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{
            padding: '16px',
            background: theme === 'light' ? '#fff' : '#1E222D',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
              {assetTypes.length}
            </div>
            <div style={{ color: theme === 'light' ? '#666' : '#a0a0a0' }}>Asset Types</div>
          </div>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredAssets}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} assets`
        }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title={editingAsset ? 'Edit Asset' : 'Create Asset'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <AssetForm
          asset={editingAsset}
          onSuccess={handleFormSubmit}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default AssetList;
