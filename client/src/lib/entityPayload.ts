import { getOrganizationId } from '@/lib/authStorage';
import type { CreateEntityFormValues } from '@/components/entities/CreateEntityForm';

const emptyToNull = (value: string) => {
  const trimmed = value?.trim?.() ?? '';
  return trimmed === '' ? null : trimmed;
};

function parseOptionalDate(value: string): string | null {
  const trimmed = value?.trim?.() ?? '';
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function buildEntityPayload(values: CreateEntityFormValues, organizationId = getOrganizationId()) {
  const tagMap = Object.entries(values.selectedTags || {}).reduce<Record<string, string>>(
    (acc, [tagName, tagValue]) => {
      const trimmed = tagValue?.trim?.() ?? '';
      if (trimmed) {
        acc[tagName] = trimmed;
      }
      return acc;
    },
    {},
  );

  return {
    storeName: values.storeName.trim(),
    area: emptyToNull(values.area),
    entityId: values.entityId.trim(),
    storeStatus: values.storeStatus,
    city: emptyToNull(values.city),
    region: emptyToNull(values.region),
    regionId: emptyToNull(values.regionId),
    cityId: emptyToNull(values.cityId),
    districtId: emptyToNull(values.districtId),
    countryId: emptyToNull(values.countryId),
    stateId: emptyToNull(values.stateId),
    locationCityId: emptyToNull(values.locationCityId),
    staff: parseInt(values.staff, 10) || 0,
    status: values.status,
    latitude: parseFloat(values.latitude) || 0,
    longitude: parseFloat(values.longitude) || 0,
    storeRadius: parseInt(values.storeRadius, 10) || 100,
    organizationId,
    tags: tagMap,
    registrationName: emptyToNull(values.registrationName),
    companyId: emptyToNull(values.companyId),
    taxSchemeId: emptyToNull(values.taxSchemeId),
    businessCategory: emptyToNull(values.businessCategory),
    businessIdentificationId: emptyToNull(values.businessIdentificationId),
    identificationScheme: emptyToNull(values.identificationScheme),
    streetName: emptyToNull(values.streetName),
    districtName: emptyToNull(values.districtName),
    cityName: emptyToNull(values.cityName),
    buildingNumber: emptyToNull(values.buildingNumber),
    postalZone: emptyToNull(values.postalZone),
    countryIdentificationCode: emptyToNull(values.countryIdentificationCode),
    csrIndustryBusinessCategory: emptyToNull(values.csrIndustryBusinessCategory),
    csrCommonName: emptyToNull(values.csrCommonName),
    csrSerialNumber: emptyToNull(values.csrSerialNumber),
    csrOrganizationIdentifier: emptyToNull(values.csrOrganizationIdentifier),
    csrOrganizationUnitName: emptyToNull(values.csrOrganizationUnitName),
    csrOrganizationName: emptyToNull(values.csrOrganizationName),
    csrCountryName: emptyToNull(values.csrCountryName),
    csrInvoiceType: emptyToNull(values.csrInvoiceType),
    csrLocationAddress: emptyToNull(values.csrLocationAddress),
    csrEnvironmentType: emptyToNull(values.csrEnvironmentType),
    generatedCsr: emptyToNull(values.generatedCsr),
    generatedPrivateKey: emptyToNull(values.generatedPrivateKey),
    ccsidOtp: emptyToNull(values.ccsidOtp),
    ccsidBinaryToken: emptyToNull(values.ccsidBinaryToken),
    tokenSecret: emptyToNull(values.tokenSecret),
    requestId: emptyToNull(values.requestId),
    pcsidBinaryToken: emptyToNull(values.pcsidBinaryToken),
    pcsidSecret: emptyToNull(values.pcsidSecret),
    registeredDate: parseOptionalDate(values.registeredDate),
  };
}

export const ENTITY_PROFILE_FIELD_KEYS = [
  'registrationName',
  'companyId',
  'taxSchemeId',
  'businessCategory',
  'businessIdentificationId',
  'identificationScheme',
  'streetName',
  'districtName',
  'cityName',
  'buildingNumber',
  'postalZone',
  'countryIdentificationCode',
  'csrIndustryBusinessCategory',
  'csrCommonName',
  'csrSerialNumber',
  'csrOrganizationIdentifier',
  'csrOrganizationUnitName',
  'csrOrganizationName',
  'csrCountryName',
  'csrInvoiceType',
  'csrLocationAddress',
  'csrEnvironmentType',
  'generatedCsr',
  'generatedPrivateKey',
  'ccsidOtp',
  'ccsidBinaryToken',
  'tokenSecret',
  'requestId',
  'pcsidBinaryToken',
  'pcsidSecret',
  'registeredDate',
] as const;
