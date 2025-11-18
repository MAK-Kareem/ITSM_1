import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, message, Row, Col, Divider } from 'antd';
import { Asset, User } from '../../types';
import assetService from '../../services/asset.service';
import userService from '../../services/user.service';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface AssetFormProps {
  asset: Asset | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Mock Suppliers
const mockSuppliers = [
  { id: 'S1', name: 'TechGlobal Inc.' },
  { id: 'S2', name: 'OfficeSolutions Ltd.' },
  { id: 'S3', name: 'SoftwareWorld' },
  { id: 'S4', name: 'AWS' },
  { id: 'S5', name: 'Microsoft Azure' },
  { id: 'S6', name: 'Google Cloud' },
];

// Dynamic Categories by Asset Type
const categoriesByType: Record<string, string[]> = {
  'Hardware': ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Network Device', 'Server', 'Other'],
  'Software': ['Operating System', 'Productivity', 'Design', 'Development', 'Security', 'Database', 'Other'],
  'License': ['Per-User License', 'Volume License', 'Subscription', 'Enterprise', 'Other'],
  'Cloud Asset': ['Virtual Machine', 'Storage', 'Database', 'SaaS Subscription', 'Network', 'Other'],
  'Furniture': ['Desk', 'Chair', 'Cabinet', 'Table', 'Shelf', 'Other'],
  'Vehicle': ['Car', 'Van', 'Truck', 'Motorcycle', 'Other'],
  'Mobile Device': ['Smartphone', 'Tablet', 'Laptop', 'Wearable', 'Other'],
  'IoT Device': ['Sensor', 'Camera', 'Smart Lock', 'Gateway', 'Controller', 'Other'],
  'Digital Certificate': ['SSL/TLS', 'Code Signing', 'Email', 'Document Signing', 'Other'],
  'Access Credential': ['API Key', 'Service Account', 'SSH Key', 'Database Credential', 'OAuth Token', 'Other'],
};

const AssetForm: React.FC<AssetFormProps> = ({ asset, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [itManagers, setItManagers] = useState<User[]>([]);
  const [suppliers] = useState(mockSuppliers);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const userList = await userService.getAll();
        setAllUsers(userList);
        const managerList = await userService.getITManagers();
        setItManagers(managerList);
      } catch (error) {
        message.error('Failed to load users for dropdowns');
        console.error('Error loading users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  // Initialize form when asset changes
  useEffect(() => {
    if (asset) {
      // Set state for conditional rendering
      setSelectedType(asset.type || null);
      setSelectedCategory(asset.category || null);

      // Set form values with date conversions
      form.setFieldsValue({
        ...asset,
        purchaseDate: asset.purchaseDate ? dayjs(asset.purchaseDate) : null,
        warrantyExpiry: asset.warrantyExpiry ? dayjs(asset.warrantyExpiry) : null,
        licenseExpiry: asset.licenseExpiry ? dayjs(asset.licenseExpiry) : null,
        subscriptionStart: asset.subscriptionStart ? dayjs(asset.subscriptionStart) : null,
        subscriptionEnd: asset.subscriptionEnd ? dayjs(asset.subscriptionEnd) : null,
        insuranceExpiry: asset.insuranceExpiry ? dayjs(asset.insuranceExpiry) : null,
        registrationExpiry: asset.registrationExpiry ? dayjs(asset.registrationExpiry) : null,
        issueDate: asset.issueDate ? dayjs(asset.issueDate) : null,
        expiryDate: asset.expiryDate ? dayjs(asset.expiryDate) : null,
        lastRotated: asset.lastRotated ? dayjs(asset.lastRotated) : null,
        rotationDue: asset.rotationDue ? dayjs(asset.rotationDue) : null,
      });
    } else {
      // Reset for new asset
      setSelectedType(null);
      setSelectedCategory(null);
      form.resetFields();
      form.setFieldsValue({ status: 'In Stock' });
    }
  }, [asset, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Format dates and remove null values
      const formattedValues: any = {};

      Object.keys(values).forEach(key => {
        const value = values[key];

        // Skip null or undefined values
        if (value === null || value === undefined) {
          return;
        }

        // Handle date fields (dayjs objects)
        if (value && typeof value === 'object' && typeof value.format === 'function') {
          formattedValues[key] = value.format('YYYY-MM-DD');
        }
        // Convert numeric fields to numbers
        else if (key === 'purchaseCost' || key === 'monthlyCost') {
          formattedValues[key] = typeof value === 'string' ? parseFloat(value) : value;
        }
        // Convert integer fields to integers
        else if (key === 'licenseSeats' || key === 'year' || key === 'mileage') {
          formattedValues[key] = typeof value === 'string' ? parseInt(value, 10) : value;
        }
        else {
          formattedValues[key] = value;
        }
      });

      if (asset) {
        await assetService.update(asset.id, formattedValues);
        message.success('Asset updated successfully');
      } else {
        await assetService.create(formattedValues);
        message.success('Asset created successfully');
      }

      // Reset form and state
      form.resetFields();
      setSelectedType(null);
      setSelectedCategory(null);

      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setSelectedCategory(null);
    form.setFieldsValue({ category: null, customCategory: null });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value !== 'Other') {
      form.setFieldsValue({ customCategory: null });
    }
  };

  // Get categories for current type (with safety check)
  const getCategoriesForType = (): string[] => {
    if (!selectedType) return [];
    return categoriesByType[selectedType] || [];
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      {/* BASIC INFORMATION */}
      <Divider orientation="left">Basic Information</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="name" label="Asset Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., MacBook Pro 16-inch" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="assetTag" label="Asset Tag" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., EAZY-LAP-0012" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="type" label="Asset Type" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Select type" onChange={handleTypeChange}>
              <Option value="Hardware">Hardware</Option>
              <Option value="Software">Software</Option>
              <Option value="License">License</Option>
              <Option value="Cloud Asset">Cloud Asset</Option>
              <Option value="Furniture">Furniture & Fixtures</Option>
              <Option value="Vehicle">Vehicle</Option>
              <Option value="Mobile Device">Mobile Device</Option>
              <Option value="IoT Device">IoT Device</Option>
              <Option value="Digital Certificate">Digital Certificate</Option>
              <Option value="Access Credential">Access Credential</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Select category" disabled={!selectedType} onChange={handleCategoryChange}>
              {getCategoriesForType().map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Custom Category Field - Shows when "Other" is selected */}
      {selectedCategory === 'Other' && (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="customCategory"
              label="Custom Category Name"
              rules={[{ required: true, message: 'Please specify the category' }]}
            >
              <Input placeholder="Enter custom category name (e.g., Peripherals, Accessories)" />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Required' }]}>
            <Select>
              <Option value="Active">Active</Option>
              <Option value="In Stock">In Stock</Option>
              <Option value="Maintenance">Maintenance</Option>
              <Option value="Retired">Retired</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g., Main Office, Floor 3, Desk 101" />
          </Form.Item>
        </Col>
      </Row>

      {/* OWNERSHIP */}
      <Divider orientation="left">Ownership & Assignment</Divider>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="assignedTo" label="Assigned To">
            <Select placeholder="Assign to user" allowClear showSearch loading={loadingUsers} filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}>
              {allUsers.map(user => (
                <Option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.username})</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="assetOwnerId" label="Asset Owner">
            <Select placeholder="Select owner" allowClear showSearch loading={loadingUsers} filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}>
              {allUsers.map(user => (
                <Option key={user.id} value={user.id}>{user.firstName} {user.lastName}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="assetManagerId" label="Asset Manager">
            <Select placeholder="Select manager" allowClear showSearch loading={loadingUsers} filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}>
              {itManagers.map(user => (
                <Option key={user.id} value={user.id}>{user.firstName} {user.lastName}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* HARDWARE SPECIFIC */}
      {selectedType === 'Hardware' && (
        <>
          <Divider orientation="left">Hardware Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="manufacturer" label="Manufacturer">
                <Input placeholder="e.g., Apple, Dell, HP" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Model">
                <Input placeholder="e.g., M2 Pro, XPS 15" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="serialNumber" label="Serial Number">
                <Input placeholder="Enter serial number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warrantyExpiry" label="Warranty Expiry">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* SOFTWARE/LICENSE SPECIFIC */}
      {(selectedType === 'Software' || selectedType === 'License') && (
        <>
          <Divider orientation="left">Software/License Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="licenseKey" label="License Key">
                <Input.Password placeholder="Enter license key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="licenseSeats" label="Total Seats / Users">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="e.g., 50" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="licenseExpiry" label="License Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* CLOUD ASSET SPECIFIC */}
      {selectedType === 'Cloud Asset' && (
        <>
          <Divider orientation="left">Cloud Asset Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cloudProvider" label="Cloud Provider">
                <Select placeholder="Select provider">
                  <Option value="AWS">AWS</Option>
                  <Option value="Azure">Microsoft Azure</Option>
                  <Option value="GCP">Google Cloud</Option>
                  <Option value="DigitalOcean">DigitalOcean</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cloudRegion" label="Region">
                <Input placeholder="e.g., us-east-1, eu-west-1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="instanceType" label="Instance Type">
                <Input placeholder="e.g., t3.medium, Standard_D2s_v3" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="instanceId" label="Instance ID">
                <Input placeholder="Enter instance ID" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="subscriptionStart" label="Subscription Start">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="subscriptionEnd" label="Subscription End">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="monthlyCost" label="Monthly Cost">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} addonAfter="$" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* FURNITURE SPECIFIC */}
      {selectedType === 'Furniture' && (
        <>
          <Divider orientation="left">Furniture Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="material" label="Material">
                <Input placeholder="e.g., Wood, Metal, Plastic" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dimensions" label="Dimensions">
                <Input placeholder="e.g., 120x60x75 cm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="condition" label="Condition">
                <Select placeholder="Select condition">
                  <Option value="New">New</Option>
                  <Option value="Good">Good</Option>
                  <Option value="Fair">Fair</Option>
                  <Option value="Poor">Poor</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="Color">
                <Input placeholder="e.g., Black, White, Brown" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* VEHICLE SPECIFIC */}
      {selectedType === 'Vehicle' && (
        <>
          <Divider orientation="left">Vehicle Details</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="make" label="Make">
                <Input placeholder="e.g., Toyota, Ford" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="vehicleModel" label="Model">
                <Input placeholder="e.g., Camry, F-150" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="year" label="Year">
                <InputNumber style={{ width: '100%' }} min={1900} max={new Date().getFullYear() + 1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="licensePlate" label="License Plate">
                <Input placeholder="Enter license plate" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vin" label="VIN">
                <Input placeholder="Vehicle Identification Number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fuelType" label="Fuel Type">
                <Select placeholder="Select fuel type">
                  <Option value="Petrol">Petrol</Option>
                  <Option value="Diesel">Diesel</Option>
                  <Option value="Electric">Electric</Option>
                  <Option value="Hybrid">Hybrid</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="mileage" label="Mileage (km)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="insuranceExpiry" label="Insurance Expiry">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="registrationExpiry" label="Registration Expiry">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* MOBILE DEVICE SPECIFIC */}
      {selectedType === 'Mobile Device' && (
        <>
          <Divider orientation="left">Mobile Device Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="manufacturer" label="Manufacturer">
                <Input placeholder="e.g., Apple, Samsung" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Model">
                <Input placeholder="e.g., iPhone 14, Galaxy S23" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="imei" label="IMEI">
                <Input placeholder="Enter IMEI number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phoneNumber" label="Phone Number">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="carrier" label="Carrier">
                <Input placeholder="e.g., Verizon, AT&T" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dataPlan" label="Data Plan">
                <Input placeholder="e.g., Unlimited, 50GB" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="simNumber" label="SIM Number">
                <Input placeholder="Enter SIM number" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* IoT DEVICE SPECIFIC */}
      {selectedType === 'IoT Device' && (
        <>
          <Divider orientation="left">IoT Device Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deviceId" label="Device ID">
                <Input placeholder="Unique device identifier" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ipAddress" label="IP Address">
                <Input placeholder="e.g., 192.168.1.100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="macAddress" label="MAC Address">
                <Input placeholder="e.g., 00:1B:44:11:3A:B7" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="firmwareVersion" label="Firmware Version">
                <Input placeholder="e.g., v2.3.1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="protocol" label="Protocol">
                <Select placeholder="Select protocol">
                  <Option value="MQTT">MQTT</Option>
                  <Option value="HTTP">HTTP</Option>
                  <Option value="CoAP">CoAP</Option>
                  <Option value="Zigbee">Zigbee</Option>
                  <Option value="Z-Wave">Z-Wave</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* DIGITAL CERTIFICATE SPECIFIC */}
      {selectedType === 'Digital Certificate' && (
        <>
          <Divider orientation="left">Certificate Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="certificateType" label="Certificate Type">
                <Select placeholder="Select type">
                  <Option value="SSL/TLS">SSL/TLS</Option>
                  <Option value="Code Signing">Code Signing</Option>
                  <Option value="Email">Email</Option>
                  <Option value="Document Signing">Document Signing</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="domain" label="Domain">
                <Input placeholder="e.g., example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="issuer" label="Issuer">
                <Input placeholder="Certificate issuer" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="certificateAuthority" label="Certificate Authority">
                <Input placeholder="e.g., Let's Encrypt, DigiCert" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="issueDate" label="Issue Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiryDate" label="Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="certificateThumbprint" label="Certificate Thumbprint">
                <TextArea rows={2} placeholder="SHA-256 fingerprint" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* ACCESS CREDENTIAL SPECIFIC */}
      {selectedType === 'Access Credential' && (
        <>
          <Divider orientation="left">Credential Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="credentialType" label="Credential Type">
                <Select placeholder="Select type">
                  <Option value="API Key">API Key</Option>
                  <Option value="Service Account">Service Account</Option>
                  <Option value="SSH Key">SSH Key</Option>
                  <Option value="Database Credential">Database Credential</Option>
                  <Option value="OAuth Token">OAuth Token</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accessLevel" label="Access Level">
                <Select placeholder="Select access level">
                  <Option value="Read">Read</Option>
                  <Option value="Write">Write</Option>
                  <Option value="Admin">Admin</Option>
                  <Option value="Custom">Custom</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="scope" label="Scope / Permissions">
                <Input placeholder="e.g., read:users, write:data" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="credentialValue" label="Credential Value">
                <Input.Password placeholder="API key, token, or credential (encrypted)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastRotated" label="Last Rotated">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rotationDue" label="Rotation Due">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      {/* PROCUREMENT & FINANCIALS */}
      <Divider orientation="left">Procurement & Financials</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="supplierId" label="Supplier / Vendor">
            <Select placeholder="Select supplier" allowClear showSearch filterOption={(input, option) => (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())}>
              {suppliers.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="invoiceNumber" label="Invoice / Quotation Number">
            <Input placeholder="e.g., INV-2024-001, QT-2024-045" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="purchaseDate" label="Purchase Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="purchaseCost" label="Purchase Cost">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} addonAfter="$" />
          </Form.Item>
        </Col>
      </Row>

      {/* NOTES */}
      <Form.Item name="notes" label="Notes / Description">
        <TextArea rows={4} placeholder="Add any relevant notes..." />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {asset ? 'Update' : 'Create'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AssetForm;
