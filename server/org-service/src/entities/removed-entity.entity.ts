import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('removed_entities')
export class RemovedEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'store_name', length: 255 })
  storeName: string;

  @Column({ length: 100, nullable: true })
  area: string;

  @Column({ name: 'entity_id', length: 100, nullable: true })
  entityId: string;

  @Column({ name: 'store_status', length: 50, nullable: true })
  storeStatus: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ name: 'region_name', length: 100, nullable: true })
  region: string;

  @Column({ name: 'region_id', length: 36, nullable: true })
  regionId: string;

  @Column({ name: 'city_id', length: 36, nullable: true })
  cityId: string;

  @Column({ name: 'district_id', length: 36, nullable: true })
  districtId: string;

  @Column({ nullable: true, type: 'integer' })
  staff: number;

  @Column({ default: true, nullable: true })
  status: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8, default: 0.00000000 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, default: 0.00000000 })
  longitude: number;

  @Column({ name: 'store_radius', default: 100, type: 'integer' })
  storeRadius: number;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: any;

  @Column({ length: 255, nullable: true })
  registrationName: string;

  @Column({ length: 100, nullable: true })
  companyId: string;

  @Column({ length: 50, nullable: true })
  taxSchemeId: string;

  @Column({ length: 255, nullable: true })
  businessCategory: string;

  @Column({ length: 100, nullable: true })
  businessIdentificationId: string;

  @Column({ length: 50, nullable: true })
  identificationScheme: string;

  @Column({ length: 255, nullable: true })
  streetName: string;

  @Column({ length: 100, nullable: true })
  districtName: string;

  @Column({ length: 100, nullable: true })
  cityName: string;

  @Column({ length: 50, nullable: true })
  buildingNumber: string;

  @Column({ length: 50, nullable: true })
  postalZone: string;

  @Column({ length: 10, nullable: true })
  countryIdentificationCode: string;

  @Column({ length: 255, nullable: true })
  csrIndustryBusinessCategory: string;

  @Column({ length: 255, nullable: true })
  csrCommonName: string;

  @Column({ length: 255, nullable: true })
  csrSerialNumber: string;

  @Column({ length: 255, nullable: true })
  csrOrganizationIdentifier: string;

  @Column({ length: 255, nullable: true })
  csrOrganizationUnitName: string;

  @Column({ length: 255, nullable: true })
  csrOrganizationName: string;

  @Column({ length: 10, nullable: true })
  csrCountryName: string;

  @Column({ length: 100, nullable: true })
  csrInvoiceType: string;

  @Column({ length: 500, nullable: true })
  csrLocationAddress: string;

  @Column({ length: 50, nullable: true })
  csrEnvironmentType: string;

  @Column({ type: 'text', nullable: true })
  generatedCsr: string;

  @Column({ type: 'text', nullable: true })
  generatedPrivateKey: string;

  @Column({ length: 100, nullable: true })
  ccsidOtp: string;

  @Column({ type: 'text', nullable: true })
  ccsidBinaryToken: string;

  @Column({ length: 255, nullable: true })
  tokenSecret: string;

  @Column({ length: 100, nullable: true })
  requestId: string;

  @Column({ type: 'text', nullable: true })
  pcsidBinaryToken: string;

  @Column({ length: 255, nullable: true })
  pcsidSecret: string;

  @Column({ type: 'timestamp', nullable: true })
  registeredDate: Date;

  @CreateDateColumn({ name: 'removed_at' })
  removedAt: Date;

  @Column({ name: 'original_created_at', nullable: true })
  originalCreatedAt: Date;

  @Column({ length: 255, nullable: true })
  createdBy: string;

  @Column({ length: 255, nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
