import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  MapPin,
  Tag,
  Briefcase,
  Shield,
  Monitor,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import SaLocationSelectors, { type SaLocationSelection } from "@/components/entities/SaLocationSelectors";

export type EntityTagOption = {
  id: number | string;
  tag: string;
  tagValues: string[];
  mandatory?: boolean | string;
};

export type CreateEntityFormValues = {
  storeName: string;
  entityId: string;
  area: string;
  city: string;
  region: string;
  regionId: string;
  cityId: string;
  districtId: string;
  // Generic country / state / city
  countryId: string;
  stateId: string;
  locationCityId: string;
  countryName: string;
  stateName: string;
  locationCityName: string;
  staff: string;
  status: boolean;
  storeStatus: string;
  latitude: string;
  longitude: string;
  storeRadius: string;
  selectedTags: Record<string, string>;
  registrationName: string;
  companyId: string;
  taxSchemeId: string;
  businessCategory: string;
  businessIdentificationId: string;
  identificationScheme: string;
  streetName: string;
  districtName: string;
  cityName: string;
  buildingNumber: string;
  postalZone: string;
  countryIdentificationCode: string;
  csrIndustryBusinessCategory: string;
  csrCommonName: string;
  csrSerialNumber: string;
  csrOrganizationIdentifier: string;
  csrOrganizationUnitName: string;
  csrOrganizationName: string;
  csrCountryName: string;
  csrInvoiceType: string;
  csrLocationAddress: string;
  csrEnvironmentType: string;
  generatedCsr: string;
  generatedPrivateKey: string;
  ccsidOtp: string;
  ccsidBinaryToken: string;
  tokenSecret: string;
  requestId: string;
  pcsidBinaryToken: string;
  pcsidSecret: string;
  registeredDate: string;
};

export const initialCreateEntityFormValues: CreateEntityFormValues = {
  storeName: "",
  entityId: "",
  area: "",
  city: "",
  region: "",
  regionId: "",
  cityId: "",
  districtId: "",
  // Generic country / state / city
  countryId: "",
  stateId: "",
  locationCityId: "",
  countryName: "",
  stateName: "",
  locationCityName: "",
  staff: "",
  status: true,
  storeStatus: "Functional",
  latitude: "0.00000000",
  longitude: "0.00000000",
  storeRadius: "100",
  selectedTags: {},
  registrationName: "",
  companyId: "",
  taxSchemeId: "VAT",
  businessCategory: "",
  businessIdentificationId: "",
  identificationScheme: "CRN",
  streetName: "",
  districtName: "",
  cityName: "",
  buildingNumber: "",
  postalZone: "",
  countryIdentificationCode: "SA",
  csrIndustryBusinessCategory: "",
  csrCommonName: "",
  csrSerialNumber: "",
  csrOrganizationIdentifier: "",
  csrOrganizationUnitName: "",
  csrOrganizationName: "",
  csrCountryName: "SA",
  csrInvoiceType: "",
  csrLocationAddress: "",
  csrEnvironmentType: "NonProduction",
  generatedCsr: "",
  generatedPrivateKey: "",
  ccsidOtp: "",
  ccsidBinaryToken: "",
  tokenSecret: "",
  requestId: "",
  pcsidBinaryToken: "",
  pcsidSecret: "",
  registeredDate: "",
};

const FORM_TABS = [
  { value: "entity-info", labelKey: "entityInfoTab", icon: Building2 },
  { value: "geo-location", labelKey: "geoLocationTab", icon: MapPin },
  { value: "tags", labelKey: "tagsTab", icon: Tag },
  { value: "business-info", labelKey: "businessInfoTab", icon: Briefcase },
  { value: "csr-configuration", labelKey: "csrConfigTab", icon: Shield },
  { value: "register-device", labelKey: "registerDeviceTab", icon: Monitor },
] as const;

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

interface CreateEntityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateEntityFormValues) => void;
  entityTags?: EntityTagOption[];
  submitting?: boolean;
}

export default function CreateEntityForm({
  open,
  onOpenChange,
  onSubmit,
  entityTags = [],
  submitting = false,
}: CreateEntityFormProps) {
  const { language, t } = useLanguage();
  const preferArabic = language === "ar";
  const [activeTab, setActiveTab] = useState("entity-info");
  const [formData, setFormData] = useState<CreateEntityFormValues>(initialCreateEntityFormValues);

  const applyLocationSelection = (selection: SaLocationSelection) => {
    const regionLabel = selection.region
      ? preferArabic && selection.region.nameAr
        ? selection.region.nameAr
        : selection.region.name
      : "";
    const cityLabel = selection.city
      ? preferArabic && selection.city.nameAr
        ? selection.city.nameAr
        : selection.city.name
      : "";
    const districtLabel = selection.district
      ? preferArabic && selection.district.nameAr
        ? selection.district.nameAr
        : selection.district.name
      : "";

    setFormData((prev) => ({
      ...prev,
      regionId: selection.regionId,
      cityId: selection.cityId,
      districtId: selection.districtId,
      region: regionLabel,
      city: cityLabel,
      area: districtLabel,
      cityName: cityLabel,
      districtName: districtLabel,
      postalZone: selection.district?.postalCode || prev.postalZone,
    }));
  };

  useEffect(() => {
    if (!open) {
      setFormData(initialCreateEntityFormValues);
      setActiveTab("entity-info");
    }
  }, [open]);

  const updateField = <K extends keyof CreateEntityFormValues>(
    key: K,
    value: CreateEntityFormValues[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSelectedTag = (tagName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: { ...prev.selectedTags, [tagName]: value },
    }));
  };

  const isMandatoryTag = (tag: EntityTagOption) =>
    tag.mandatory === 'YES' || tag.mandatory === true;

  const handleSubmit = () => {
    if (!formData.storeName.trim() || !formData.entityId.trim()) {
      toast.error(t('storeNameAndEntityIdRequired'));
      setActiveTab("entity-info");
      return;
    }

    const missingMandatory = entityTags.filter(
      (tag) => isMandatoryTag(tag) && !formData.selectedTags[tag.tag]?.trim(),
    );
    if (missingMandatory.length > 0) {
      toast.error(
        t('fillMandatoryTags').replace('{{tags}}', missingMandatory.map((tag) => tag.tag).join(', ')),
      );
      setActiveTab("tags");
      return;
    }

    onSubmit(formData);
  };

  const handleGenerateCsr = () => {
    updateField(
      "generatedCsr",
      "-----BEGIN CERTIFICATE REQUEST-----\nMOCK_CSR_PLACEHOLDER\n-----END CERTIFICATE REQUEST-----"
    );
    updateField(
      "generatedPrivateKey",
      "-----BEGIN EC PRIVATE KEY-----\nMOCK_PRIVATE_KEY_PLACEHOLDER\n-----END EC PRIVATE KEY-----"
    );
    toast.success(t('csrGeneratedPreview'));
  };

  const handleGetCcsid = () => {
    updateField("ccsidBinaryToken", "MOCK_CCSID_BINARY_TOKEN");
    toast.success(t('ccsidRetrievedPreview'));
  };

  const handleGetPcsid = () => {
    updateField("pcsidBinaryToken", "MOCK_PCSID_BINARY_TOKEN");
    toast.success(t('pcsidRetrievedPreview'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(960px,calc(100vw-2rem))] max-w-[960px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle className="text-2xl font-bold tracking-tight">{t('addNewEntity')}</DialogTitle>
          <DialogDescription>
            {t('fillInTheDetailsToCreateANewEntity')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border/60 bg-muted/20 px-6 py-3">
            <TabsList className="flex h-auto w-full flex-wrap gap-2 bg-transparent p-0">
              {FORM_TABS.map(({ value, labelKey, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="h-auto min-h-10 rounded-lg border border-transparent px-3 py-2 text-xs whitespace-normal data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {t(labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <TabsContent value="entity-info" className="mt-0">
              <SectionCard title={t('entityInfoTab')} icon={Building2}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">
                      {t('storeName')}
                      <span className="ml-1 text-destructive">*</span>
                    </Label>
                    <Input
                      id="storeName"
                      value={formData.storeName}
                      onChange={(e) => updateField("storeName", e.target.value)}
                      placeholder="Main Branch"
                      className="focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entityId">
                      {t('entityId')}
                      <span className="ml-1 text-destructive">*</span>
                    </Label>
                    <Input
                      id="entityId"
                      value={formData.entityId}
                      onChange={(e) => updateField("entityId", e.target.value)}
                      placeholder="ENT-001"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('locationSaudiNationalAddress')}</Label>
                    <p className="text-xs text-muted-foreground">{t('locationOptionalHint')}</p>
                    <SaLocationSelectors
                      preferArabic={preferArabic}
                      value={{
                        regionId: formData.regionId,
                        cityId: formData.cityId,
                        districtId: formData.districtId,
                      }}
                      onChange={applyLocationSelection}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff">{t('staffCount')}</Label>
                    <Input
                      id="staff"
                      type="number"
                      min="0"
                      value={formData.staff}
                      onChange={(e) => updateField("staff", e.target.value)}
                      placeholder="24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeStatus">{t('storeStatus')}</Label>
                    <Select
                      value={formData.storeStatus}
                      onValueChange={(value) => updateField("storeStatus", value)}
                    >
                      <SelectTrigger id="storeStatus">
                        <SelectValue placeholder={t('selectStoreStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Functional">{t('functional')}</SelectItem>
                        <SelectItem value="Non-Functional">{t('nonFunctional')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('activeStatus')}</Label>
                    <div className="flex h-10 items-center gap-3">
                      <Switch
                        id="status"
                        checked={formData.status}
                        onCheckedChange={(checked) => updateField("status", checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.status ? t('active') : t('inactive')}
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="geo-location" className="mt-0">
              <SectionCard title={t('geoLocationDetails')} icon={MapPin}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">{t('latitude')}</Label>
                    <Input
                      id="latitude"
                      value={formData.latitude}
                      onChange={(e) => updateField("latitude", e.target.value)}
                      placeholder="24.68600000"
                    />
                    <p className="text-xs text-muted-foreground">{t('latitudeRangeHint')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">{t('longitude')}</Label>
                    <Input
                      id="longitude"
                      value={formData.longitude}
                      onChange={(e) => updateField("longitude", e.target.value)}
                      placeholder="46.72200000"
                    />
                    <p className="text-xs text-muted-foreground">{t('longitudeRangeHint')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeRadius">{t('storeRadiusMeters')}</Label>
                  <Input
                    id="storeRadius"
                    type="number"
                    min="100"
                    max="3000"
                    value={formData.storeRadius}
                    onChange={(e) => updateField("storeRadius", e.target.value)}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('storeRadiusRangeHint')}
                  </p>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="tags" className="mt-0">
              <SectionCard title={t('tags')} icon={Tag}>
                {entityTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('noTagsAvailableCreateInTagsTab')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {entityTags.map((tag) => (
                      <div key={tag.id} className="space-y-2">
                        <Label htmlFor={`create-tag-${tag.id}`}>
                          {tag.tag}
                          {isMandatoryTag(tag) ? (
                            <span className="ml-1 text-destructive">*</span>
                          ) : null}
                        </Label>
                        {tag.tagValues && tag.tagValues.length > 0 ? (
                          <Select
                            value={formData.selectedTags[tag.tag] || ''}
                            onValueChange={(value) => updateSelectedTag(tag.tag, value)}
                          >
                            <SelectTrigger id={`create-tag-${tag.id}`}>
                              <SelectValue placeholder={t('selectTag').replace('{{tag}}', tag.tag)} />
                            </SelectTrigger>
                            <SelectContent>
                              {tag.tagValues.map((value, index) => (
                                <SelectItem key={`${tag.id}-${index}`} value={value}>
                                  {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={`create-tag-${tag.id}`}
                            placeholder={t('enterTag').replace('{{tag}}', tag.tag)}
                            value={formData.selectedTags[tag.tag] || ''}
                            onChange={(e) => updateSelectedTag(tag.tag, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="business-info" className="mt-0">
              <SectionCard title={t('businessInfoTab')} icon={Briefcase}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="registrationName">Registration name</Label>
                    <Input
                      id="registrationName"
                      value={formData.registrationName}
                      onChange={(e) => updateField("registrationName", e.target.value)}
                      placeholder="Example Holding Company"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="companyId">Company ID</Label>
                      <Input
                        id="companyId"
                        value={formData.companyId}
                        onChange={(e) => updateField("companyId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxSchemeId">Tax scheme ID</Label>
                      <Input
                        id="taxSchemeId"
                        value={formData.taxSchemeId}
                        onChange={(e) => updateField("taxSchemeId", e.target.value)}
                        placeholder="VAT"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessCategory">Business category</Label>
                      <Input
                        id="businessCategory"
                        value={formData.businessCategory}
                        onChange={(e) => updateField("businessCategory", e.target.value)}
                        placeholder="food and beverage services"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessIdentificationId">Business identification ID</Label>
                      <Input
                        id="businessIdentificationId"
                        value={formData.businessIdentificationId}
                        onChange={(e) => updateField("businessIdentificationId", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="identificationScheme">Identification scheme</Label>
                      <Input
                        id="identificationScheme"
                        value={formData.identificationScheme}
                        onChange={(e) => updateField("identificationScheme", e.target.value)}
                        placeholder="CRN"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="streetName">{t('streetName')}</Label>
                    <Input
                      id="streetName"
                      value={formData.streetName}
                      onChange={(e) => updateField("streetName", e.target.value)}
                      placeholder="King Fahd Road"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">{t('address')}</Label>
                    <Textarea
                      id="businessAddress"
                      value={formData.csrLocationAddress}
                      onChange={(e) => updateField("csrLocationAddress", e.target.value)}
                      rows={3}
                      placeholder="Enter full address"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="buildingNumber">Building number</Label>
                      <Input
                        id="buildingNumber"
                        value={formData.buildingNumber}
                        onChange={(e) => updateField("buildingNumber", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalZone">Postal zone</Label>
                      <Input
                        id="postalZone"
                        value={formData.postalZone}
                        onChange={(e) => updateField("postalZone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="countryIdentificationCode">Country identification code</Label>
                      <Input
                        id="countryIdentificationCode"
                        value={formData.countryIdentificationCode}
                        onChange={(e) => updateField("countryIdentificationCode", e.target.value)}
                        placeholder="SA"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="csr-configuration" className="mt-0">
              <SectionCard title={t('csrConfigTab')} icon={Shield}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="csrIndustryBusinessCategory">CSR industry business category</Label>
                    <Input
                      id="csrIndustryBusinessCategory"
                      value={formData.csrIndustryBusinessCategory}
                      onChange={(e) => updateField("csrIndustryBusinessCategory", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csrCommonName">CSR common name</Label>
                    <Input
                      id="csrCommonName"
                      value={formData.csrCommonName}
                      onChange={(e) => updateField("csrCommonName", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csrSerialNumber">CSR serial number</Label>
                  <Input
                    id="csrSerialNumber"
                    value={formData.csrSerialNumber}
                    onChange={(e) => updateField("csrSerialNumber", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="csrOrganizationIdentifier">CSR organization identifier</Label>
                    <Input
                      id="csrOrganizationIdentifier"
                      value={formData.csrOrganizationIdentifier}
                      onChange={(e) => updateField("csrOrganizationIdentifier", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csrOrganizationUnitName">CSR organization unit name</Label>
                    <Input
                      id="csrOrganizationUnitName"
                      value={formData.csrOrganizationUnitName}
                      onChange={(e) => updateField("csrOrganizationUnitName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csrOrganizationName">CSR organization name</Label>
                    <Input
                      id="csrOrganizationName"
                      value={formData.csrOrganizationName}
                      onChange={(e) => updateField("csrOrganizationName", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="csrCountryName">CSR country name</Label>
                    <Input
                      id="csrCountryName"
                      value={formData.csrCountryName}
                      onChange={(e) => updateField("csrCountryName", e.target.value)}
                      placeholder="SA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csrInvoiceType">CSR invoice type</Label>
                    <Input
                      id="csrInvoiceType"
                      value={formData.csrInvoiceType}
                      onChange={(e) => updateField("csrInvoiceType", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csrLocationAddress">CSR location address</Label>
                    <Input
                      id="csrLocationAddress"
                      value={formData.csrLocationAddress}
                      onChange={(e) => updateField("csrLocationAddress", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csrEnvironmentType">CSR environment type</Label>
                    <Select
                      value={formData.csrEnvironmentType}
                      onValueChange={(value) => updateField("csrEnvironmentType", value)}
                    >
                      <SelectTrigger id="csrEnvironmentType">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NonProduction">NonProduction</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Simulation">Simulation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="border-primary text-primary" onClick={handleGenerateCsr}>
                    {t('generateCsr')}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generatedCsr">Generated CSR</Label>
                  <Textarea
                    id="generatedCsr"
                    value={formData.generatedCsr}
                    readOnly
                    rows={5}
                    placeholder="Generated CSR will appear here"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generatedPrivateKey">Generated EC Secp256k1 private-key (PEM)</Label>
                  <Textarea
                    id="generatedPrivateKey"
                    value={formData.generatedPrivateKey}
                    readOnly
                    rows={5}
                    placeholder="Generated private key will appear here"
                    className="font-mono text-xs"
                  />
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="register-device" className="mt-0">
              <SectionCard title={t('registerDeviceTab')} icon={Monitor}>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="ccsidOtp">CCSID OTP</Label>
                    <Input
                      id="ccsidOtp"
                      value={formData.ccsidOtp}
                      onChange={(e) => updateField("ccsidOtp", e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" className="border-primary text-primary" onClick={handleGetCcsid}>
                      {t('getCcsid')}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ccsidBinaryToken">CCSID binary token</Label>
                  <Textarea
                    id="ccsidBinaryToken"
                    value={formData.ccsidBinaryToken}
                    onChange={(e) => updateField("ccsidBinaryToken", e.target.value)}
                    rows={4}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tokenSecret">Token secret</Label>
                    <Input
                      id="tokenSecret"
                      type="password"
                      value={formData.tokenSecret}
                      onChange={(e) => updateField("tokenSecret", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestId">Request ID</Label>
                    <Input
                      id="requestId"
                      value={formData.requestId}
                      onChange={(e) => updateField("requestId", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" className="border-primary text-primary" onClick={handleGetPcsid}>
                    {t('getPcsid')}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pcsidBinaryToken">PCSID binary token</Label>
                  <Textarea
                    id="pcsidBinaryToken"
                    value={formData.pcsidBinaryToken}
                    onChange={(e) => updateField("pcsidBinaryToken", e.target.value)}
                    rows={4}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pcsidSecret">PCSID secret</Label>
                    <Input
                      id="pcsidSecret"
                      type="password"
                      value={formData.pcsidSecret}
                      onChange={(e) => updateField("pcsidSecret", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registeredDate">Registered date</Label>
                    <Input
                      id="registeredDate"
                      type="datetime-local"
                      value={formData.registeredDate}
                      onChange={(e) => updateField("registeredDate", e.target.value)}
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {t('createEntity')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
