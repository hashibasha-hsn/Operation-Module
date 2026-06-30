import type { HierarchyStoreCoverage } from "@/components/users/UserHierarchyDetails";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isInternalEntityId(value?: string | null): boolean {
  return Boolean(value && UUID_PATTERN.test(value));
}

export function findEntityByRef(entities: any[], refId?: string | null) {
  if (!refId) return undefined;
  return entities.find((entry) => entry.id === refId || entry.entityId === refId);
}

/** Business store code (e.g. HO), never the internal UUID primary key. */
export function getEntityStoreCode(entity?: any): string {
  if (!entity?.entityId || isInternalEntityId(entity.entityId)) return "";
  return entity.entityId;
}

export function toHierarchyStoreCoverage(entity: any): HierarchyStoreCoverage {
  const storeCode = getEntityStoreCode(entity);
  return {
    storeName: entity.storeName || "Unknown store",
    storeId: storeCode || "N/A",
  };
}

export function getUserDefaultStoreName(user: any, entities: any[], notAvailable = "N/A"): string {
  const refId = user?.storeId || user?.entityId;
  const entity = findEntityByRef(entities, refId);
  return entity?.storeName || user?.storeName || notAvailable;
}

export function normalizeStoreIds(value: unknown): string[] {
  if (!value) return [];
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((store) => (typeof store === "string" ? store : store?.id))
    .filter(Boolean);
}

export function getStoresUnderCoverage(user: any, entities: any[]): HierarchyStoreCoverage[] {
  const stores: HierarchyStoreCoverage[] = [];
  const seen = new Set<string>();

  const addStore = (storeId?: string) => {
    if (!storeId || seen.has(storeId)) return;
    const entity = findEntityByRef(entities, storeId);
    if (!entity) return;
    seen.add(storeId);
    stores.push(toHierarchyStoreCoverage(entity));
  };

  addStore(user?.storeId || user?.entityId);
  normalizeStoreIds(user?.additionalStores).forEach(addStore);

  return stores.sort((a, b) => a.storeName.localeCompare(b.storeName));
}

export function countHierarchySubordinates(
  userName: string,
  getDirectReports: (userName: string) => any[],
): number {
  const directReports = getDirectReports(userName);
  return directReports.reduce(
    (total, report) =>
      total + 1 + countHierarchySubordinates(report.name, getDirectReports),
    0,
  );
}

export function resolveHierarchyUser(node: any, users: any[]) {
  if (!node) return null;
  return (
    users.find(
      (user) =>
        (node.userId && (user.userId === node.userId || user.id === node.userId)) ||
        user.name === node.name,
    ) || node
  );
}
