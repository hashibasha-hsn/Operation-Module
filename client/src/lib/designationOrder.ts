/** Matches seeded system role hierarchy (Company Admin → Store Employee). */
const SYSTEM_ROLE_HIERARCHY: Record<string, number> = {
  company_admin: 1,
  non_creator_company_admin: 2,
  area_manager: 3,
  non_creator_area_manager: 4,
  process_manager: 5,
  user_manager: 6,
  store_manager: 7,
  non_creator_store_manager: 8,
  store_employee: 9,
};

const SCOPE_LEVEL_ORDER: Record<string, number> = {
  org: 1,
  regional: 2,
  store: 3,
  task: 4,
};

type SystemRoleLike = {
  name?: string;
  displayName?: string;
  scopeLevel?: string;
} | null | undefined;

export function getSystemRoleSortRank(role: SystemRoleLike): number {
  if (!role) return Number.MAX_SAFE_INTEGER;
  if (role.name && SYSTEM_ROLE_HIERARCHY[role.name] != null) {
    return SYSTEM_ROLE_HIERARCHY[role.name];
  }
  if (role.scopeLevel && SCOPE_LEVEL_ORDER[role.scopeLevel] != null) {
    return SCOPE_LEVEL_ORDER[role.scopeLevel] * 100;
  }
  return Number.MAX_SAFE_INTEGER - 1;
}

export function sortDesignationsBySystemRole<
  T extends { name?: string; systemRole?: SystemRoleLike },
>(designations: T[]): T[] {
  return [...designations].sort((a, b) => {
    const rankDiff = getSystemRoleSortRank(a.systemRole) - getSystemRoleSortRank(b.systemRole);
    if (rankDiff !== 0) return rankDiff;
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });
}

export function sortSystemRolesByHierarchy<
  T extends { name?: string; displayName?: string; scopeLevel?: string },
>(roles: T[]): T[] {
  return [...roles].sort((a, b) => {
    const rankDiff = getSystemRoleSortRank(a) - getSystemRoleSortRank(b);
    if (rankDiff !== 0) return rankDiff;
    return (a.displayName || a.name || "").localeCompare(
      b.displayName || b.name || "",
      undefined,
      { sensitivity: "base" },
    );
  });
}
