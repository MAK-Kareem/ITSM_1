import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('assets', { schema: 'asset_management' })
export class Asset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'asset_id' })
  assetId: string;

  @Column()
  name: string;

  @Column()
  type: string; // Hardware, Software, License, Cloud, Furniture, Vehicle, Mobile Device, IoT Device, Digital Certificate, Access Credential

  @Column()
  category: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true, name: 'serial_number' })
  serialNumber: string;

  @Column()
  status: string; // Active, Inactive, Maintenance, Retired, In Stock

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo: number;

  @Column({ type: 'date', nullable: true, name: 'purchase_date' })
  purchaseDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'purchase_cost' })
  purchaseCost: number;

  @Column({ type: 'date', nullable: true, name: 'warranty_expiry' })
  warrantyExpiry: Date;

  @Column({ type: 'jsonb', nullable: true })
  specifications: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // === COMMON FIELDS ===
  @Column({ nullable: true, name: 'asset_tag' })
  assetTag: string;

  @Column({ nullable: true, name: 'asset_owner_id' })
  assetOwnerId: number;

  @Column({ nullable: true, name: 'asset_manager_id' })
  assetManagerId: number;

  @Column({ nullable: true, name: 'supplier_id' })
  supplierId: string;

  @Column({ nullable: true, name: 'invoice_number' })
  invoiceNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // === SOFTWARE/LICENSE FIELDS ===
  @Column({ nullable: true, name: 'license_key' })
  licenseKey: string;

  @Column({ type: 'int', nullable: true, name: 'license_seats' })
  licenseSeats: number;

  @Column({ type: 'date', nullable: true, name: 'license_expiry' })
  licenseExpiry: Date;

  // === CLOUD ASSET FIELDS ===
  @Column({ nullable: true, name: 'cloud_provider' })
  cloudProvider: string; // AWS, Azure, GCP, etc.

  @Column({ nullable: true, name: 'cloud_region' })
  cloudRegion: string;

  @Column({ nullable: true, name: 'instance_type' })
  instanceType: string;

  @Column({ nullable: true, name: 'instance_id' })
  instanceId: string;

  @Column({ type: 'date', nullable: true, name: 'subscription_start' })
  subscriptionStart: Date;

  @Column({ type: 'date', nullable: true, name: 'subscription_end' })
  subscriptionEnd: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'monthly_cost' })
  monthlyCost: number;

  // === FURNITURE FIELDS ===
  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  dimensions: string; // e.g., "120x60x75 cm"

  @Column({ nullable: true })
  condition: string; // New, Good, Fair, Poor

  @Column({ nullable: true })
  color: string;

  // === VEHICLE FIELDS ===
  @Column({ nullable: true })
  make: string; // Toyota, Ford, etc.

  @Column({ nullable: true, name: 'vehicle_model' })
  vehicleModel: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ nullable: true, name: 'license_plate' })
  licensePlate: string;

  @Column({ nullable: true })
  vin: string; // Vehicle Identification Number

  @Column({ nullable: true, name: 'fuel_type' })
  fuelType: string; // Petrol, Diesel, Electric, Hybrid

  @Column({ type: 'int', nullable: true })
  mileage: number;

  @Column({ type: 'date', nullable: true, name: 'insurance_expiry' })
  insuranceExpiry: Date;

  @Column({ type: 'date', nullable: true, name: 'registration_expiry' })
  registrationExpiry: Date;

  // === MOBILE DEVICE FIELDS ===
  @Column({ nullable: true })
  imei: string;

  @Column({ nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ nullable: true })
  carrier: string; // Verizon, AT&T, etc.

  @Column({ nullable: true, name: 'data_plan' })
  dataPlan: string;

  @Column({ nullable: true, name: 'sim_number' })
  simNumber: string;

  // === IoT DEVICE FIELDS ===
  @Column({ nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ nullable: true, name: 'mac_address' })
  macAddress: string;

  @Column({ nullable: true, name: 'firmware_version' })
  firmwareVersion: string;

  @Column({ nullable: true })
  protocol: string; // MQTT, HTTP, CoAP, etc.

  @Column({ nullable: true, name: 'device_id' })
  deviceId: string;

  // === DIGITAL CERTIFICATE FIELDS ===
  @Column({ nullable: true, name: 'certificate_type' })
  certificateType: string; // SSL/TLS, Code Signing, etc.

  @Column({ nullable: true })
  issuer: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ type: 'date', nullable: true, name: 'issue_date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate: Date;

  @Column({ nullable: true, name: 'certificate_authority' })
  certificateAuthority: string;

  @Column({ type: 'text', nullable: true, name: 'certificate_thumbprint' })
  certificateThumbprint: string;

  // === ACCESS CREDENTIAL FIELDS ===
  @Column({ nullable: true, name: 'credential_type' })
  credentialType: string; // API Key, Service Account, SSH Key, etc.

  @Column({ type: 'text', nullable: true, name: 'credential_value' })
  credentialValue: string; // Should be encrypted in production

  @Column({ nullable: true })
  scope: string; // Permissions/access level

  @Column({ nullable: true, name: 'access_level' })
  accessLevel: string; // Read, Write, Admin, etc.

  @Column({ type: 'date', nullable: true, name: 'last_rotated' })
  lastRotated: Date;

  @Column({ type: 'date', nullable: true, name: 'rotation_due' })
  rotationDue: Date;
}
