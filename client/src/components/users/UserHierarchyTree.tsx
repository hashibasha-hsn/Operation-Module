import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildHierarchyContext } from "@/lib/userHierarchy";
import type { HierarchyUser } from "@/lib/userHierarchy";

export type { HierarchyUser };

type Props = {
  users: HierarchyUser[];
  getDirectReports?: (userName: string) => HierarchyUser[];
  selectedUserId?: string | null;
  onSelectUser?: (user: HierarchyUser) => void;
  searchPlaceholder?: string;
  expandAllLabel?: string;
  collapseAllLabel?: string;
};

function getUserId(user: HierarchyUser) {
  return String(user.userId || user.id || user.name);
}

function RoleBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground">
      {label}
    </span>
  );
}

function collectExpandableIds(
  nodes: HierarchyUser[],
  getDirectReports: (userName: string) => HierarchyUser[],
): string[] {
  const ids: string[] = [];
  const walk = (node: HierarchyUser) => {
    const children = getDirectReports(node.name);
    if (children.length > 0) {
      ids.push(getUserId(node));
      children.forEach(walk);
    }
  };
  nodes.forEach(walk);
  return ids;
}

function nodeMatchesSearch(user: HierarchyUser, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (user.name || "").toLowerCase().includes(q);
}

function subtreeHasMatch(
  user: HierarchyUser,
  query: string,
  getDirectReports: (userName: string) => HierarchyUser[],
): boolean {
  if (nodeMatchesSearch(user, query)) return true;
  return getDirectReports(user.name).some((child) =>
    subtreeHasMatch(child, query, getDirectReports),
  );
}

function getVisibleDirectReports(
  userName: string,
  query: string,
  getDirectReports: (userName: string) => HierarchyUser[],
): HierarchyUser[] {
  const children = getDirectReports(userName);
  const q = query.trim().toLowerCase();
  if (!q) return children;
  return children.filter((child) => subtreeHasMatch(child, query, getDirectReports));
}

function collectExpandableIdsForSearch(
  nodes: HierarchyUser[],
  query: string,
  getDirectReports: (userName: string) => HierarchyUser[],
): string[] {
  const ids: string[] = [];
  const walk = (node: HierarchyUser) => {
    const visibleChildren = getVisibleDirectReports(node.name, query, getDirectReports);
    if (visibleChildren.length > 0) {
      ids.push(getUserId(node));
      visibleChildren.forEach(walk);
    }
  };
  nodes.forEach(walk);
  return ids;
}

function HierarchyNode({
  user,
  depth,
  expandedIds,
  onToggle,
  getDirectReports,
  searchQuery,
  selectedUserId,
  onSelectUser,
  isLast,
}: {
  user: HierarchyUser;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  getDirectReports: (userName: string) => HierarchyUser[];
  searchQuery: string;
  selectedUserId?: string | null;
  onSelectUser?: (user: HierarchyUser) => void;
  isLast: boolean;
}) {
  const nodeId = getUserId(user);
  const children = getVisibleDirectReports(user.name, searchQuery, getDirectReports);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(nodeId);
  const isMatch = nodeMatchesSearch(user, searchQuery);
  const isSelected = selectedUserId === nodeId;

  return (
    <div className="relative">
      <div
        className="relative flex items-center gap-2 py-1.5"
        style={{ paddingLeft: `${depth * 28}px` }}
      >
        {depth > 0 && (
          <>
            <span
              className="pointer-events-none absolute border-slate-300"
              style={{
                left: `${depth * 28 - 14}px`,
                top: 0,
                bottom: isLast && !hasChildren ? "50%" : 0,
                borderLeftWidth: "1px",
              }}
            />
            <span
              className="pointer-events-none absolute border-slate-300"
              style={{
                left: `${depth * 28 - 14}px`,
                top: "50%",
                width: "14px",
                borderTopWidth: "1px",
              }}
            />
          </>
        )}

        {hasChildren ? (
          <button
            type="button"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={() => onToggle(nodeId)}
            className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center border border-slate-400 bg-white text-slate-700 hover:bg-slate-50"
          >
            {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </button>
        ) : (
          <span className="relative z-10 h-5 w-5 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelectUser?.(user)}
          className={`text-sm text-left hover:underline ${
            isSelected
              ? "font-semibold text-primary"
              : isMatch && searchQuery.trim()
                ? "font-medium text-primary"
                : "font-normal text-foreground"
          }`}
        >
          {user.name}
        </button>
        <RoleBadge label={user.designation || "N/A"} />
      </div>

      {hasChildren && isExpanded && (
        <div>
          {children.map((child, index) => (
            <HierarchyNode
              key={getUserId(child)}
              user={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              getDirectReports={getDirectReports}
              searchQuery={searchQuery}
              selectedUserId={selectedUserId}
              onSelectUser={onSelectUser}
              isLast={index === children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserHierarchyTree({
  users,
  getDirectReports,
  selectedUserId = null,
  onSelectUser,
  searchPlaceholder = "Search by name",
  expandAllLabel = "Expand All",
  collapseAllLabel = "Collapse All",
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const hierarchyContext = useMemo(() => buildHierarchyContext(users), [users]);
  const rootUsers = hierarchyContext.rootUsers;
  const resolveDirectReports = getDirectReports ?? hierarchyContext.getDirectReports;
  const visibleRoots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rootUsers;
    return rootUsers.filter((root) => subtreeHasMatch(root, searchQuery, resolveDirectReports));
  }, [rootUsers, searchQuery, resolveDirectReports]);
  const allExpandableIds = useMemo(
    () => collectExpandableIds(rootUsers, resolveDirectReports),
    [rootUsers, resolveDirectReports],
  );
  const searchExpandableIds = useMemo(
    () => collectExpandableIdsForSearch(visibleRoots, searchQuery, resolveDirectReports),
    [visibleRoots, searchQuery, resolveDirectReports],
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedIds(new Set(searchExpandableIds));
    } else {
      setExpandedIds(new Set(allExpandableIds));
    }
  }, [searchQuery, searchExpandableIds, allExpandableIds]);

  const toggleNode = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-10 bg-background"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-4 text-xs font-medium"
            onClick={() => setExpandedIds(new Set(allExpandableIds))}
          >
            {expandAllLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-4 text-xs font-medium"
            onClick={() => setExpandedIds(new Set())}
          >
            {collapseAllLabel}
          </Button>
        </div>
      </div>

      <div className="p-4 min-h-[420px] max-h-[70vh] overflow-y-auto">
        {visibleRoots.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {searchQuery.trim() ? "No users found matching that name" : "No users found"}
          </p>
        ) : (
          visibleRoots.map((user, index) => (
            <HierarchyNode
              key={getUserId(user)}
              user={user}
              depth={0}
              expandedIds={expandedIds}
              onToggle={toggleNode}
              getDirectReports={resolveDirectReports}
              searchQuery={searchQuery}
              selectedUserId={selectedUserId}
              onSelectUser={onSelectUser}
              isLast={index === visibleRoots.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
