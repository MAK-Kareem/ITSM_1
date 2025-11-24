import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsObject,
  IsInt,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Helper to convert null to undefined
const NullToUndefined = () =>
  Transform(({ value }) => (value === null ? undefined : value));

export class CreateAssetDto {
  // === COMMON REQUIRED FIELDS ===
  @IsString()
  name: string;

  @IsString()
  assetTag: string;

  @IsString()
  type: string;

  @IsString()
  category: string;

  @IsOptional()
  @ValidateIf((o) => o.customCategory !== null)
  @IsString()
  @NullToUndefined()
  customCategory?: string;

  @IsString()
  status: string;

  // === COMMON OPTIONAL FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.assignedTo !== null)
  @IsNumber()
  @NullToUndefined()
  assignedTo?: number;

  @IsOptional()
  @ValidateIf((o) => o.assetOwnerId !== null)
  @IsNumber()
  @NullToUndefined()
  assetOwnerId?: number;

  @IsOptional()
  @ValidateIf((o) => o.assetManagerId !== null)
  @IsNumber()
  @NullToUndefined()
  assetManagerId?: number;

  @IsOptional()
  @ValidateIf((o) => o.location !== null)
  @IsString()
  @NullToUndefined()
  location?: string;

  @IsOptional()
  @ValidateIf((o) => o.manufacturer !== null)
  @IsString()
  @NullToUndefined()
  manufacturer?: string;

  @IsOptional()
  @ValidateIf((o) => o.model !== null)
  @IsString()
  @NullToUndefined()
  model?: string;

  @IsOptional()
  @ValidateIf((o) => o.serialNumber !== null)
  @IsString()
  @NullToUndefined()
  serialNumber?: string;

  @IsOptional()
  @ValidateIf((o) => o.warrantyExpiry !== null)
  @IsDateString()
  @NullToUndefined()
  warrantyExpiry?: string;

  @IsOptional()
  @ValidateIf((o) => o.supplierId !== null)
  @IsString()
  @NullToUndefined()
  supplierId?: string;

  @IsOptional()
  @ValidateIf((o) => o.purchaseDate !== null)
  @IsDateString()
  @NullToUndefined()
  purchaseDate?: string;

  @IsOptional()
  @ValidateIf((o) => o.purchaseCost !== null)
  @IsNumber()
  @NullToUndefined()
  purchaseCost?: number;

  @IsOptional()
  @ValidateIf((o) => o.notes !== null)
  @IsString()
  @NullToUndefined()
  notes?: string;

  @IsOptional()
  @ValidateIf((o) => o.specifications !== null)
  @IsObject()
  @NullToUndefined()
  specifications?: any;

  @IsOptional()
  @ValidateIf((o) => o.metadata !== null)
  @IsObject()
  @NullToUndefined()
  metadata?: any;

  // === SOFTWARE/LICENSE FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.licenseKey !== null)
  @IsString()
  @NullToUndefined()
  licenseKey?: string;

  @IsOptional()
  @ValidateIf((o) => o.licenseSeats !== null)
  @IsInt()
  @NullToUndefined()
  licenseSeats?: number;

  @IsOptional()
  @ValidateIf((o) => o.licenseExpiry !== null)
  @IsDateString()
  @NullToUndefined()
  licenseExpiry?: string;

  // === CLOUD ASSET FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.cloudProvider !== null)
  @IsString()
  @NullToUndefined()
  cloudProvider?: string;

  @IsOptional()
  @ValidateIf((o) => o.cloudRegion !== null)
  @IsString()
  @NullToUndefined()
  cloudRegion?: string;

  @IsOptional()
  @ValidateIf((o) => o.instanceType !== null)
  @IsString()
  @NullToUndefined()
  instanceType?: string;

  @IsOptional()
  @ValidateIf((o) => o.instanceId !== null)
  @IsString()
  @NullToUndefined()
  instanceId?: string;

  @IsOptional()
  @ValidateIf((o) => o.subscriptionStart !== null)
  @IsDateString()
  @NullToUndefined()
  subscriptionStart?: string;

  @IsOptional()
  @ValidateIf((o) => o.subscriptionEnd !== null)
  @IsDateString()
  @NullToUndefined()
  subscriptionEnd?: string;

  @IsOptional()
  @ValidateIf((o) => o.monthlyCost !== null)
  @IsNumber()
  @NullToUndefined()
  monthlyCost?: number;

  // === FURNITURE FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.material !== null)
  @IsString()
  @NullToUndefined()
  material?: string;

  @IsOptional()
  @ValidateIf((o) => o.dimensions !== null)
  @IsString()
  @NullToUndefined()
  dimensions?: string;

  @IsOptional()
  @ValidateIf((o) => o.condition !== null)
  @IsString()
  @NullToUndefined()
  condition?: string;

  @IsOptional()
  @ValidateIf((o) => o.color !== null)
  @IsString()
  @NullToUndefined()
  color?: string;

  // === VEHICLE FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.make !== null)
  @IsString()
  @NullToUndefined()
  make?: string;

  @IsOptional()
  @ValidateIf((o) => o.vehicleModel !== null)
  @IsString()
  @NullToUndefined()
  vehicleModel?: string;

  @IsOptional()
  @ValidateIf((o) => o.year !== null)
  @IsInt()
  @NullToUndefined()
  year?: number;

  @IsOptional()
  @ValidateIf((o) => o.licensePlate !== null)
  @IsString()
  @NullToUndefined()
  licensePlate?: string;

  @IsOptional()
  @ValidateIf((o) => o.vin !== null)
  @IsString()
  @NullToUndefined()
  vin?: string;

  @IsOptional()
  @ValidateIf((o) => o.fuelType !== null)
  @IsString()
  @NullToUndefined()
  fuelType?: string;

  @IsOptional()
  @ValidateIf((o) => o.mileage !== null)
  @IsInt()
  @NullToUndefined()
  mileage?: number;

  @IsOptional()
  @ValidateIf((o) => o.insuranceExpiry !== null)
  @IsDateString()
  @NullToUndefined()
  insuranceExpiry?: string;

  @IsOptional()
  @ValidateIf((o) => o.registrationExpiry !== null)
  @IsDateString()
  @NullToUndefined()
  registrationExpiry?: string;

  // === MOBILE DEVICE FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.imei !== null)
  @IsString()
  @NullToUndefined()
  imei?: string;

  @IsOptional()
  @ValidateIf((o) => o.phoneNumber !== null)
  @IsString()
  @NullToUndefined()
  phoneNumber?: string;

  @IsOptional()
  @ValidateIf((o) => o.carrier !== null)
  @IsString()
  @NullToUndefined()
  carrier?: string;

  @IsOptional()
  @ValidateIf((o) => o.dataPlan !== null)
  @IsString()
  @NullToUndefined()
  dataPlan?: string;

  @IsOptional()
  @ValidateIf((o) => o.simNumber !== null)
  @IsString()
  @NullToUndefined()
  simNumber?: string;

  // === IoT DEVICE FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.ipAddress !== null)
  @IsString()
  @NullToUndefined()
  ipAddress?: string;

  @IsOptional()
  @ValidateIf((o) => o.macAddress !== null)
  @IsString()
  @NullToUndefined()
  macAddress?: string;

  @IsOptional()
  @ValidateIf((o) => o.firmwareVersion !== null)
  @IsString()
  @NullToUndefined()
  firmwareVersion?: string;

  @IsOptional()
  @ValidateIf((o) => o.protocol !== null)
  @IsString()
  @NullToUndefined()
  protocol?: string;

  @IsOptional()
  @ValidateIf((o) => o.deviceId !== null)
  @IsString()
  @NullToUndefined()
  deviceId?: string;

  // === DIGITAL CERTIFICATE FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.certificateType !== null)
  @IsString()
  @NullToUndefined()
  certificateType?: string;

  @IsOptional()
  @ValidateIf((o) => o.issuer !== null)
  @IsString()
  @NullToUndefined()
  issuer?: string;

  @IsOptional()
  @ValidateIf((o) => o.domain !== null)
  @IsString()
  @NullToUndefined()
  domain?: string;

  @IsOptional()
  @ValidateIf((o) => o.issueDate !== null)
  @IsDateString()
  @NullToUndefined()
  issueDate?: string;

  @IsOptional()
  @ValidateIf((o) => o.expiryDate !== null)
  @IsDateString()
  @NullToUndefined()
  expiryDate?: string;

  @IsOptional()
  @ValidateIf((o) => o.certificateAuthority !== null)
  @IsString()
  @NullToUndefined()
  certificateAuthority?: string;

  @IsOptional()
  @ValidateIf((o) => o.certificateThumbprint !== null)
  @IsString()
  @NullToUndefined()
  certificateThumbprint?: string;

  // === ACCESS CREDENTIAL FIELDS ===
  @IsOptional()
  @ValidateIf((o) => o.credentialType !== null)
  @IsString()
  @NullToUndefined()
  credentialType?: string;

  @IsOptional()
  @ValidateIf((o) => o.credentialValue !== null)
  @IsString()
  @NullToUndefined()
  credentialValue?: string;

  @IsOptional()
  @ValidateIf((o) => o.scope !== null)
  @IsString()
  @NullToUndefined()
  scope?: string;

  @IsOptional()
  @ValidateIf((o) => o.accessLevel !== null)
  @IsString()
  @NullToUndefined()
  accessLevel?: string;

  @IsOptional()
  @ValidateIf((o) => o.lastRotated !== null)
  @IsDateString()
  @NullToUndefined()
  lastRotated?: string;

  @IsOptional()
  @ValidateIf((o) => o.rotationDue !== null)
  @IsDateString()
  @NullToUndefined()
  rotationDue?: string;

 @IsOptional()
 @IsString()
 invoiceNumber?: string;
}

export class UpdateAssetDto extends CreateAssetDto {}
