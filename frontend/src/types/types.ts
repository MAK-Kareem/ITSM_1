// ========== USER TYPES ==========
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  department?: string;
  isActive?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// ========== ASSET TYPES ==========
export interface Asset {
  id: number;
  assetId: string;
  name: string;
  type: AssetType;
  category: string;
  status: AssetStatus;
  location?: string;
  assignedTo?: number;
  assetOwnerId?: number;
  assetManagerId?: number;

  // Common fields
  assetTag?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  supplierId?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  notes?: string;
  specifications?: any;
  metadata?: any;

  // Software/License fields
  licenseKey?: string;
  licenseSeats?: number;
  licenseExpiry?: string;

  // Cloud Asset fields
  cloudProvider?: string;
  cloudRegion?: string;
  instanceType?: string;
  instanceId?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  monthlyCost?: number;

  // Furniture fields
  material?: string;
  dimensions?: string;
  condition?: string;
  color?: string;

  // Vehicle fields
  make?: string;
  vehicleModel?: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  fuelType?: string;
  mileage?: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;

  // Mobile Device fields
  imei?: string;
  phoneNumber?: string;
  carrier?: string;
  dataPlan?: string;
  simNumber?: string;

  // IoT Device fields
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion?: string;
  protocol?: string;
  deviceId?: string;

  // Digital Certificate fields
  certificateType?: string;
  issuer?: string;
  domain?: string;
  issueDate?: string;
  expiryDate?: string;
  certificateAuthority?: string;
  certificateThumbprint?: string;

  // Access Credential fields
  credentialType?: string;
  credentialValue?: string;
  scope?: string;
  accessLevel?: string;
  lastRotated?: string;
  rotationDue?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export type AssetType =
  | 'Hardware'
  | 'Software'
  | 'License'
  | 'Cloud Asset'
  | 'Furniture'
  | 'Vehicle'
  | 'Mobile Device'
  | 'IoT Device'
  | 'Digital Certificate'
  | 'Access Credential';

export type AssetStatus =
  | 'Active'
  | 'In Stock'
  | 'Maintenance'
  | 'Retired'
  | 'Inactive';
