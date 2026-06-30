import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('entities')
export class BusinessEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  storeName: string;

  @Column({ length: 100, nullable: true })
  area: string;

  @Column({ length: 100, unique: true, nullable: true })
  entityId: string;

  @Column({ length: 50, default: 'Functional' })
  storeStatus: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ name: 'regionName', length: 100, nullable: true })
  region: string;

  @Column({ length: 36, nullable: true })
  regionId: string;

  @Column({ length: 36, nullable: true })
  cityId: string;

  @Column({ length: 36, nullable: true })
  districtId: string;

  @Column({ nullable: true, type: 'integer' })
  staff: number;

  @Column({ default: true })
  status: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8, default: 0.00000000 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, default: 0.00000000 })
  longitude: number;

  @Column({ default: 100, type: 'integer' })
  storeRadius: number;

  @Column()
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
