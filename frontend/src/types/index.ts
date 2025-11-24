// User and Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles: string[];  // Array of all roles from AD groups
  isActive: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// Asset Types
export interface Asset {
  id: number;
  assetId: string;
  name: string;
  type: AssetType;
  category: string;
  customCategory?: string;
  status: AssetStatus;

  // -- OWNERSHIP FIELDS --
  assignedTo?: number;     // The person using the asset
  assetOwnerId?: number;   // The person/dept responsible (e.g., "IT Dept")
  assetManagerId?: number; // The person who manages the asset lifecycle
  location?: string;

  // -- COMMON FIELDS --
  supplierId?: string;     // ID of the supplier
  assetTag?: string;       // The physical tag ID
  notes?: string;          // A text field for notes
  manufacturer?: string;
  model?: string;
  serialNumber?: string;

  // -- LIFECYCLE FIELDS --
  purchaseDate?: string;
  purchaseCost?: number | string;
  warrantyExpiry?: string;

  // -- SOFTWARE/LICENSE FIELDS --
  licenseKey?: string;
  licenseSeats?: number;
  licenseExpiry?: string;

  // -- CLOUD ASSET FIELDS --
  cloudProvider?: string;      // AWS, Azure, GCP, etc.
  cloudRegion?: string;        // us-east-1, eu-west-1, etc.
  instanceType?: string;       // t3.medium, Standard_D2s_v3
  instanceId?: string;         // Unique cloud instance ID
  subscriptionStart?: string;
  subscriptionEnd?: string;
  monthlyCost?: number | string;

  // -- FURNITURE FIELDS --
  material?: string;           // Wood, Metal, Plastic
  dimensions?: string;         // 120x60x75 cm
  condition?: string;          // New, Good, Fair, Poor
  color?: string;

  // -- VEHICLE FIELDS --
  make?: string;               // Toyota, Ford, etc.
  vehicleModel?: string;       // Camry, F-150
  year?: number;
  licensePlate?: string;
  vin?: string;                // Vehicle Identification Number
  fuelType?: string;           // Petrol, Diesel, Electric, Hybrid
  mileage?: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;

  // -- MOBILE DEVICE FIELDS --
  imei?: string;               // International Mobile Equipment Identity
  phoneNumber?: string;
  carrier?: string;            // Verizon, AT&T, etc.
  dataPlan?: string;
  simNumber?: string;

  // -- IoT DEVICE FIELDS --
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion?: string;
  protocol?: string;           // MQTT, HTTP, CoAP, etc.
  deviceId?: string;           // Unique device identifier

  // -- DIGITAL CERTIFICATE FIELDS --
  certificateType?: string;    // SSL/TLS, Code Signing, etc.
  issuer?: string;
  domain?: string;             // example.com
  issueDate?: string;
  expiryDate?: string;
  certificateAuthority?: string; // Let's Encrypt, DigiCert
  certificateThumbprint?: string; // SHA-256 fingerprint

  // -- ACCESS CREDENTIAL FIELDS --
  credentialType?: string;     // API Key, Service Account, SSH Key
  credentialValue?: string;    // Encrypted credential
  scope?: string;              // Permissions/access level
  accessLevel?: string;        // Read, Write, Admin
  lastRotated?: string;
  rotationDue?: string;

  // -- ORIGINAL FIELDS --
  specifications?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

// Asset Type Enum
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

// Asset Status Enum
export type AssetStatus =
  | 'Active'
  | 'In Stock'
  | 'Maintenance'
  | 'Retired'
  | 'Inactive';

// Incident Types
export interface Incident {
  id: number;
  incidentNumber: string;
  title: string;
  description: string;
  priority: string;
  severity: string;
  status: string;
  category: string;
  subcategory?: string;
  reportedBy: number;
  assignedTo?: number;
  assignedGroup?: string;
  resolution?: string;
  rootCause?: string;
  resolvedAt?: string;
  closedAt?: string;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    firstName: string;
    lastName: string;
  };
  assignee?: {
    firstName: string;
    lastName: string;
  };
}

// Ticket Types
export interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  requestType: string;
  requesterId: number;
  assignedTo?: number;
  assignedTeam?: string;
  dueDate?: string;
  resolvedAt?: string;
  satisfaction?: number;
  comments?: any;
  createdAt: string;
  updatedAt: string;
}

// Change Request Types (imported from separate file)
export * from './change-request.types';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
