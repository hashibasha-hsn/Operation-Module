import type { HierarchyStoreCoverage } from "@/components/users/UserHierarchyDetails";

export type HierarchyUser = {
  userId?: string;
  id?: string;
  name: string;
  designation?: string;
  manager?: string;
  email?: string;
};

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

export function getEntityPrimaryRef(entity: any): string {
  return String(entity?.id || entity?.entityId || "").trim();
}

export function entityMatchesStoreRef(entity: any, storeRef?: string | null): boolean {
  if (!entity || !storeRef) return false;
  const ref = String(storeRef).trim();
  return entity.id === ref || entity.entityId === ref;
}

export function resolveEntityPrimaryRef(entities: any[], storeRef?: string | null): string {
  const entity = findEntityByRef(entities, storeRef);
  return entity ? getEntityPrimaryRef(entity) : String(storeRef || "").trim();
}

export function getUserDefaultStoreRef(user: any, entities: any[]): string {
  return resolveEntityPrimaryRef(entities, user?.storeId || user?.entityId);
}

export function isEntityDefaultForUser(entity: any, user: any, entities: any[]): boolean {
  if (!user || !entity) return false;
  return entityMatchesStoreRef(entity, getUserDefaultStoreRef(user, entities));
}

export function getEligibleAdditionalStores(user: any, entities: any[]): any[] {
  return entities.filter((entity) => !isEntityDefaultForUser(entity, user, entities));
}

export function normalizeAdditionalStoreRefs(entities: any[], value: unknown): string[] {
  const seen = new Set<string>();
  const refs: string[] = [];
  normalizeStoreIds(value).forEach((storeRef) => {
    const entity = findEntityByRef(entities, storeRef);
    if (!entity) return;
    const primaryRef = getEntityPrimaryRef(entity);
    if (!primaryRef || seen.has(primaryRef)) return;
    seen.add(primaryRef);
    refs.push(primaryRef);
  });
  return refs;
}

export function getResolvedAdditionalStores(
  user: any,
  entities: any[],
  unknownStoreLabel = "Unknown store",
): Array<{ id: string; name: string; area: string }> {
  const defaultRef = getUserDefaultStoreRef(user, entities);
  return normalizeAdditionalStoreRefs(entities, user?.additionalStores)
    .filter((storeRef) => storeRef !== defaultRef)
    .map((storeRef) => {
      const entity = findEntityByRef(entities, storeRef);
      return {
        id: storeRef,
        name: entity?.storeName || unknownStoreLabel,
        area: entity?.area || "",
      };
    });
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

function normalizeHierarchyKey(value: string): string {
  return value.trim().toLowerCase();
}

type HierarchyLookup = {
  byName: Map<string, HierarchyUser>;
  byEmail: Map<string, HierarchyUser>;
  byId: Map<string, HierarchyUser>;
};

function buildHierarchyLookup(users: HierarchyUser[]): HierarchyLookup {
  const byName = new Map<string, HierarchyUser>();
  const byEmail = new Map<string, HierarchyUser>();
  const byId = new Map<string, HierarchyUser>();

  users.forEach((user) => {
    const name = String(user.name || "").trim();
    if (name) byName.set(normalizeHierarchyKey(name), user);

    const email = String((user as { email?: string }).email || "").trim();
    if (email) byEmail.set(normalizeHierarchyKey(email), user);

    const id = String(user.userId || user.id || "").trim();
    if (id) byId.set(normalizeHierarchyKey(id), user);
  });

  return { byName, byEmail, byId };
}

function resolveManagerUser(
  managerRef: string | undefined | null,
  lookup: HierarchyLookup,
): HierarchyUser | undefined {
  const ref = String(managerRef || "").trim();
  if (!ref) return undefined;

  const key = normalizeHierarchyKey(ref);
  return lookup.byName.get(key) || lookup.byEmail.get(key) || lookup.byId.get(key);
}

export type HierarchyContext = {
  hierarchyUsers: HierarchyUser[];
  rootUsers: HierarchyUser[];
  getDirectReports: (userName: string) => HierarchyUser[];
};

export function buildHierarchyContext(rawUsers: any[]): HierarchyContext {
  const hierarchyUsers: HierarchyUser[] = (rawUsers || [])
    .filter((user) => !user?.isRemoved)
    .map((user) => ({
      userId: user.userId,
      id: user.id,
      name: String(user.name || "").trim(),
      designation: user.designation,
      manager: String(user.manager || "").trim(),
      email: user.email,
    }))
    .filter((user) => user.name);

  const lookup = buildHierarchyLookup(hierarchyUsers);
  const sortByName = (a: HierarchyUser, b: HierarchyUser) =>
    a.name.localeCompare(b.name);

  const getDirectReports = (userName: string): HierarchyUser[] => {
    const managerUser = hierarchyUsers.find(
      (user) => normalizeHierarchyKey(user.name) === normalizeHierarchyKey(userName),
    );
    const managerKey = normalizeHierarchyKey(managerUser?.name || userName);

    return hierarchyUsers
      .filter((user) => {
        const resolvedManager = resolveManagerUser(user.manager, lookup);
        return (
          resolvedManager &&
          normalizeHierarchyKey(resolvedManager.name) === managerKey
        );
      })
      .sort(sortByName);
  };

  let rootUsers = hierarchyUsers
    .filter((user) => {
      const managerRef = String(user.manager || "").trim();
      if (!managerRef) return true;
      return !resolveManagerUser(managerRef, lookup);
    })
    .sort(sortByName);

  if (rootUsers.length === 0 && hierarchyUsers.length > 0) {
    const referencedAsManager = new Set<string>();
    hierarchyUsers.forEach((user) => {
      const manager = resolveManagerUser(user.manager, lookup);
      if (manager) referencedAsManager.add(normalizeHierarchyKey(manager.name));
    });
    rootUsers = hierarchyUsers
      .filter((user) => !referencedAsManager.has(normalizeHierarchyKey(user.name)))
      .sort(sortByName);
  }

  if (rootUsers.length === 0 && hierarchyUsers.length > 0) {
    rootUsers = [...hierarchyUsers].sort(sortByName);
  }

  return {
    hierarchyUsers,
    rootUsers,
    getDirectReports,
  };
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

export function getUserPrimaryRef(user?: any): string {
  return String(user?.userId || user?.id || "").trim();
}

export function findUserByRef(users: any[], ref?: string | null) {
  const normalized = String(ref || "").trim();
  if (!normalized) return undefined;

  return users.find(
    (user) =>
      user?.userId === normalized ||
      user?.id === normalized ||
      user?.email === normalized ||
      user?.employeeId === normalized,
  );
}

export function getUserNameByRef(
  users: any[],
  ref?: string | null,
  unknownLabel = "Unknown user",
): string {
  const user = findUserByRef(users, ref);
  if (!user) return unknownLabel;
  const name = String(user.name || "").trim();
  if (name && !UUID_PATTERN.test(name)) return name;
  const email = String(user.email || "").trim();
  if (email && !UUID_PATTERN.test(email)) return email;
  const employeeId = String(user.employeeId || "").trim();
  if (employeeId && !UUID_PATTERN.test(employeeId)) return employeeId;
  return unknownLabel;
}

export function getEntityStoreName(
  entities: any[],
  storeRef?: string | null,
  unknownLabel = "Unknown store",
): string {
  const entity = findEntityByRef(entities, storeRef);
  if (!entity) return unknownLabel;
  return String(entity.storeName || "").trim() || unknownLabel;
}

export function isStoreAlreadyInHybridList(
  storeRows: Array<{ storeId: string }>,
  entity: any,
): boolean {
  return storeRows.some((row) => entityMatchesStoreRef(entity, row.storeId));
}
