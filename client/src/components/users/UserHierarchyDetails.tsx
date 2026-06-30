import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STORES_PAGE_SIZE = 5;

export type HierarchyStoreCoverage = {
  storeName: string;
  storeId: string;
};

type Props = {
  user: any | null;
  defaultStoreLabel: string;
  storesUnderCoverage: HierarchyStoreCoverage[];
  directReportCount: number;
  labels: {
    userDetails: string;
    name: string;
    phoneNumber: string;
    email: string;
    store: string;
    designation: string;
    users: string;
    storesUnderCoverage: string;
    storeName: string;
    storeId: string;
    selectUserPrompt: string;
    notAvailable: string;
  };
};

function formatPhone(user: any, notAvailable: string) {
  if (user?.phone) {
    return user.countryCode ? `${user.countryCode} ${user.phone}` : user.phone;
  }
  return notAvailable;
}

export default function UserHierarchyDetails({
  user,
  defaultStoreLabel,
  storesUnderCoverage,
  directReportCount,
  labels,
}: Props) {
  const [storePage, setStorePage] = useState(1);

  useEffect(() => {
    setStorePage(1);
  }, [user?.userId, user?.id, user?.name]);

  const totalStorePages = Math.max(1, Math.ceil(storesUnderCoverage.length / STORES_PAGE_SIZE));
  const currentStorePage = Math.min(storePage, totalStorePages);

  const paginatedStores = useMemo(() => {
    const start = (currentStorePage - 1) * STORES_PAGE_SIZE;
    return storesUnderCoverage.slice(start, start + STORES_PAGE_SIZE);
  }, [storesUnderCoverage, currentStorePage]);

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-card min-h-[420px] flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">{labels.selectUserPrompt}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card min-h-[420px]">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-base font-semibold text-foreground">{labels.userDetails}</h3>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">{labels.name}</p>
            <p className="font-medium text-foreground">{user.name || labels.notAvailable}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">{labels.phoneNumber}</p>
            <p className="font-medium text-foreground">{formatPhone(user, labels.notAvailable)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">{labels.email}</p>
            <p className="font-medium text-foreground break-all">{user.email || labels.notAvailable}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">{labels.store}</p>
            <p className="font-medium text-foreground">{defaultStoreLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">{labels.designation}</p>
            <p className="font-medium text-foreground">{user.designation || labels.notAvailable}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">{labels.users}</p>
            <p className="font-medium text-foreground">{directReportCount}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            {labels.storesUnderCoverage}: ({storesUnderCoverage.length})
          </p>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.storeName}</TableHead>
                  <TableHead>{labels.storeId}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      {labels.notAvailable}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStores.map((store) => (
                    <TableRow key={`${store.storeId}-${store.storeName}`}>
                      <TableCell>{store.storeName}</TableCell>
                      <TableCell>{store.storeId}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {storesUnderCoverage.length > STORES_PAGE_SIZE && (
              <div className="flex items-center justify-end gap-2 border-t px-3 py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentStorePage <= 1}
                  onClick={() => setStorePage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded border px-2 text-sm">
                  {currentStorePage}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentStorePage >= totalStorePages}
                  onClick={() => setStorePage((page) => Math.min(totalStorePages, page + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
