import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { TableActionsMenu } from '@/components/ui/table-actions-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  buildHybridCellKey,
  createHybridProfile,
  deleteHybridProfile,
  fetchHybridDashboard,
  publishHybridProfile,
  renameHybridProfile,
  addHybridStores,
  removeHybridStore,
  updateHybridCell,
  type HybridDashboard,
} from '@/lib/hybridAssigneeApi';
import {
  findUserByRef,
  getEntityPrimaryRef,
  getEntityStoreName,
  getUserNameByRef,
  getUserPrimaryRef,
  isStoreAlreadyInHybridList,
  resolveEntityPrimaryRef,
} from '@/lib/userHierarchy';
import { FilePlus2, Inbox, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

type HybridAssigneePanelProps = {
  users: any[];
  entities: any[];
};

function StatCard({
  value,
  label,
  badge,
  badgeClassName,
}: {
  value: string | number;
  label: string;
  badge: string;
  badgeClassName: string;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-3xl font-semibold leading-none">{value}</div>
            <div className="text-sm text-muted-foreground mt-2">{label}</div>
          </div>
          <Badge variant="secondary" className={badgeClassName}>
            {badge}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HybridAssigneePanel({ users, entities }: HybridAssigneePanelProps) {
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState<HybridDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storeSearch, setStoreSearch] = useState('');
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [isAddStoresOpen, setIsAddStoresOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCellDialogOpen, setIsCellDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [editProfileName, setEditProfileName] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [selectedCellUserIds, setSelectedCellUserIds] = useState<string[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);

  const unknownStoreLabel = t('unknownStore');
  const unknownUserLabel = t('unknownUser');

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchHybridDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load hybrid assignee dashboard:', err);
      toast.error(t('hybridLoadFailed'));
      setDashboard({
        stats: { activeStores: 0, profileCount: 0, maxProfiles: 15, totalAssignments: 0 },
        stores: [],
        profiles: [],
        cells: {},
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const getStoreName = useCallback(
    (storeId: string) => getEntityStoreName(entities, storeId, unknownStoreLabel),
    [entities, unknownStoreLabel],
  );

  const getUserName = useCallback(
    (userId: string) => getUserNameByRef(users, userId, unknownUserLabel),
    [users, unknownUserLabel],
  );

  const filteredStores = useMemo(() => {
    if (!dashboard) return [];
    const query = storeSearch.trim().toLowerCase();
    return dashboard.stores.filter((store) => {
      if (!query) return true;
      return getStoreName(store.storeId).toLowerCase().includes(query);
    });
  }, [dashboard, storeSearch, getStoreName]);

  const availableStoresToAdd = useMemo(() => {
    const storeRows = dashboard?.stores || [];
    return entities.filter((entity) => !isStoreAlreadyInHybridList(storeRows, entity));
  }, [dashboard, entities]);

  const openAddProfile = () => {
    setNewProfileName('');
    setIsAddProfileOpen(true);
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error(t('hybridProfileNameRequired'));
      return;
    }
    try {
      await createHybridProfile(newProfileName.trim());
      setIsAddProfileOpen(false);
      setNewProfileName('');
      await loadDashboard();
      toast.success(t('hybridProfileCreated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('hybridProfileCreateFailed'));
    }
  };

  const handleAddStores = async () => {
    if (selectedStoreIds.length === 0) {
      toast.error(t('hybridSelectStore'));
      return;
    }
    try {
      const normalizedStoreIds = selectedStoreIds.map((storeRef) =>
        resolveEntityPrimaryRef(entities, storeRef),
      );
      const data = await addHybridStores(normalizedStoreIds);
      setDashboard(data);
      setSelectedStoreIds([]);
      setIsAddStoresOpen(false);
      toast.success(t('hybridStoresAdded'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('hybridStoresAddFailed'));
    }
  };

  const handleRemoveStore = async (storeId: string) => {
    const storeName = getStoreName(storeId);
    const confirmMessage = t('hybridRemoveStoreConfirm').replace('{name}', storeName);
    if (!confirm(confirmMessage)) return;
    try {
      const data = await removeHybridStore(storeId);
      setDashboard(data);
      toast.success(t('hybridStoreRemoved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('hybridStoreRemoveFailed'));
    }
  };

  const openEditProfile = (profileId: string, name: string) => {
    setActiveProfileId(profileId);
    setEditProfileName(name);
    setIsEditProfileOpen(true);
  };

  const handleRenameProfile = async () => {
    if (!activeProfileId || !editProfileName.trim()) {
      toast.error(t('hybridProfileNameRequired'));
      return;
    }
    try {
      await renameHybridProfile(activeProfileId, editProfileName.trim());
      setIsEditProfileOpen(false);
      await loadDashboard();
      toast.success(t('hybridProfileUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('hybridProfileUpdateFailed'));
    }
  };

  const handlePublishProfile = async (profileId: string) => {
    try {
      await publishHybridProfile(profileId);
      await loadDashboard();
      toast.success(t('hybridProfilePublished'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('hybridProfilePublishFailed'));
    }
  };

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
    const confirmMessage = t('hybridDeleteProfileConfirm').replace('{name}', profileName);
    if (!confirm(confirmMessage)) return;
    try {
      await deleteHybridProfile(profileId);
      await loadDashboard();
      toast.success(t('hybridProfileDeleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('hybridProfileDeleteFailed'));
    }
  };

  const isUserSelectedForCell = useCallback(
    (user: any) => {
      const memberId = getUserPrimaryRef(user);
      return selectedCellUserIds.some((selectedId) => {
        if (selectedId === memberId) return true;
        const matched = findUserByRef(users, selectedId);
        return Boolean(
          matched &&
            (matched.userId === user.userId || matched.id === user.id),
        );
      });
    },
    [selectedCellUserIds, users],
  );

  const toggleCellUser = useCallback(
    (user: any, checked: boolean) => {
      const memberId = getUserPrimaryRef(user);
      if (checked) {
        setSelectedCellUserIds((current) =>
          current.some((selectedId) => {
            if (selectedId === memberId) return true;
            const matched = findUserByRef(users, selectedId);
            return Boolean(
              matched &&
                (matched.userId === user.userId || matched.id === user.id),
            );
          })
            ? current
            : [...current, memberId],
        );
        return;
      }

      setSelectedCellUserIds((current) =>
        current.filter((selectedId) => {
          if (selectedId === memberId) return false;
          const matched = findUserByRef(users, selectedId);
          return !(
            matched &&
            (matched.userId === user.userId || matched.id === user.id)
          );
        }),
      );
    },
    [users],
  );

  const openCellDialog = (storeId: string, profileId: string) => {
    const key = buildHybridCellKey(storeId, profileId);
    setActiveStoreId(storeId);
    setActiveProfileId(profileId);
    setSelectedCellUserIds(
      (dashboard?.cells[key] || []).map((userRef) => {
        const user = findUserByRef(users, userRef);
        return user ? getUserPrimaryRef(user) : userRef;
      }),
    );
    setIsCellDialogOpen(true);
  };

  const handleSaveCell = async () => {
    if (!activeProfileId || !activeStoreId) return;
    try {
      const normalizedUserIds = selectedCellUserIds.map((userRef) => {
        const user = findUserByRef(users, userRef);
        return user ? getUserPrimaryRef(user) : userRef;
      });
      const data = await updateHybridCell(activeProfileId, activeStoreId, normalizedUserIds);
      setDashboard(data);
      setIsCellDialogOpen(false);
      toast.success(t('hybridAssignmentsSaved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('hybridAssignmentsSaveFailed'));
    }
  };

  const stats = dashboard?.stats || {
    activeStores: 0,
    profileCount: 0,
    maxProfiles: 15,
    totalAssignments: 0,
  };
  const profiles = dashboard?.profiles || [];
  const stores = dashboard?.stores || [];
  const canAddProfile = stats.profileCount < stats.maxProfiles;
  const tableColumnCount = 1 + profiles.length + (stores.length > 0 ? 1 : 0);

  const emptyMessage = useMemo(() => {
    if (profiles.length === 0 && stores.length === 0) {
      return t('noData');
    }
    if (stores.length === 0) {
      return t('hybridAddStoresToBuild');
    }
    if (profiles.length === 0) {
      return t('hybridAddProfileToAssign');
    }
    if (filteredStores.length === 0) {
      return t('hybridNoStoresMatchSearch');
    }
    return t('noData');
  }, [profiles.length, stores.length, filteredStores.length, t]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-wide text-sky-700 uppercase">
            {t('hybridAssigneeTitle')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl mt-1">
            {t('hybridAssigneeDescription')}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0 bg-background"
          onClick={openAddProfile}
          disabled={!canAddProfile}
        >
          <FilePlus2 className="w-4 h-4" />
          {t('hybridCreate')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          value={stats.activeStores}
          label={t('hybridStores')}
          badge={t('hybridActive')}
          badgeClassName="bg-blue-100 text-blue-700 hover:bg-blue-100"
        />
        <StatCard
          value={`${stats.profileCount}/${stats.maxProfiles}`}
          label={t('hybridProfiles')}
          badge={t('hybridConfigured')}
          badgeClassName="bg-pink-100 text-pink-700 hover:bg-pink-100"
        />
        <StatCard
          value={stats.totalAssignments}
          label={t('hybridTotalAssignments')}
          badge={t('hybridUsers')}
          badgeClassName="bg-green-100 text-green-700 hover:bg-green-100"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          className="gap-2 bg-background"
          onClick={() => {
            setSelectedStoreIds([]);
            setIsAddStoresOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          {t('hybridAddStores')}
        </Button>
        <Button className="gap-2" onClick={openAddProfile} disabled={!canAddProfile}>
          <Plus className="w-4 h-4" />
          {t('hybridAddProfile')}
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[240px]">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{t('hybridStoreName')}</span>
                    <div className="relative w-full max-w-[180px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder={t('hybridSearch')}
                        value={storeSearch}
                        onChange={(event) => setStoreSearch(event.target.value)}
                        className="h-8 pl-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                </TableHead>
                {profiles.map((profile) => (
                  <TableHead key={profile.id} className="min-w-[160px] align-top">
                    <div className="flex items-start justify-between gap-1 py-1">
                      <div className="min-w-0 space-y-1">
                        <div className="truncate text-sm font-medium" title={profile.name}>
                          {profile.name}
                        </div>
                        <Badge
                          variant={profile.isPublished ? 'default' : 'outline'}
                          className="text-[10px] font-normal"
                        >
                          {profile.isPublished ? t('hybridPublished') : t('hybridDraft')}
                        </Badge>
                      </div>
                      <TableActionsMenu align="end">
                        <DropdownMenuItem onClick={() => openEditProfile(profile.id, profile.name)}>
                          {t('edit')}
                        </DropdownMenuItem>
                        {!profile.isPublished && (
                          <DropdownMenuItem onClick={() => handlePublishProfile(profile.id)}>
                            {t('publish')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteProfile(profile.id, profile.name)}
                          className="text-destructive"
                        >
                          {t('delete')}
                        </DropdownMenuItem>
                      </TableActionsMenu>
                    </div>
                  </TableHead>
                ))}
                {stores.length > 0 && (
                  <TableHead className="w-[72px] text-right">{t('action')}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumnCount}
                    className="text-center py-14 text-muted-foreground"
                  >
                    {t('loading')}
                  </TableCell>
                </TableRow>
              ) : filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColumnCount} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Inbox className="w-12 h-12 opacity-30" />
                      <span>{emptyMessage}</span>
                      {stores.length === 0 && profiles.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1"
                          onClick={() => {
                            setSelectedStoreIds([]);
                            setIsAddStoresOpen(true);
                          }}
                        >
                          {t('hybridAddStores')}
                        </Button>
                      )}
                      {profiles.length === 0 && stores.length === 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                          <Button variant="outline" size="sm" onClick={openAddProfile} disabled={!canAddProfile}>
                            {t('hybridAddProfile')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStoreIds([]);
                              setIsAddStoresOpen(true);
                            }}
                          >
                            {t('hybridAddStores')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStores.map((store) => (
                  <TableRow key={store.storeId}>
                    <TableCell className="font-medium">{getStoreName(store.storeId)}</TableCell>
                    {profiles.length === 0 ? (
                      <TableCell className="text-sm text-muted-foreground">
                        {t('hybridAddProfileToAssignRow')}
                      </TableCell>
                    ) : (
                      profiles.map((profile) => {
                        const key = buildHybridCellKey(store.storeId, profile.id);
                        const userIds = dashboard?.cells[key] || [];
                        return (
                          <TableCell key={profile.id}>
                            <button
                              type="button"
                              className="w-full min-h-[40px] rounded border border-dashed border-muted-foreground/30 px-2 py-1.5 text-left hover:border-sky-300 hover:bg-sky-50/40 transition-colors"
                              onClick={() => openCellDialog(store.storeId, profile.id)}
                            >
                              {userIds.length === 0 ? (
                                <span className="text-xs text-muted-foreground">{t('hybridAssignUsers')}</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {userIds.slice(0, 2).map((userId) => (
                                    <Badge key={userId} variant="secondary" className="text-[10px] font-normal">
                                      {getUserName(userId)}
                                    </Badge>
                                  ))}
                                  {userIds.length > 2 && (
                                    <Badge variant="outline" className="text-[10px] font-normal">
                                      +{userIds.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </button>
                          </TableCell>
                        );
                      })
                    )}
                    <TableCell className="text-right">
                      <TableActionsMenu>
                        <DropdownMenuItem
                          onClick={() => handleRemoveStore(store.storeId)}
                          className="text-destructive"
                        >
                          {t('delete')}
                        </DropdownMenuItem>
                      </TableActionsMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddProfileOpen} onOpenChange={setIsAddProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('hybridAddProfileTitle')}</DialogTitle>
            <DialogDescription>
              {t('hybridAddProfileHint').replace('{max}', String(stats.maxProfiles))}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hybridProfileName">{t('hybridProfileName')}</Label>
              <Input
                id="hybridProfileName"
                placeholder={t('hybridProfileNamePlaceholder')}
                value={newProfileName}
                onChange={(event) => setNewProfileName(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProfileOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateProfile}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
            <DialogDescription>{t('hybridRenameProfileHint')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editHybridProfileName">{t('hybridProfileName')}</Label>
              <Input
                id="editHybridProfileName"
                value={editProfileName}
                onChange={(event) => setEditProfileName(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleRenameProfile}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStoresOpen} onOpenChange={setIsAddStoresOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('hybridAddStoresTitle')}</DialogTitle>
            <DialogDescription>{t('hybridAddStoresHint')}</DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 max-h-72 overflow-y-auto">
            {availableStoresToAdd.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('hybridAllStoresAdded')}</p>
            ) : (
              availableStoresToAdd.map((entity) => {
                const storeRef = getEntityPrimaryRef(entity);
                return (
                  <div key={storeRef} className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id={`hybrid-store-${storeRef}`}
                      checked={selectedStoreIds.includes(storeRef)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStoreIds([...selectedStoreIds, storeRef]);
                        } else {
                          setSelectedStoreIds(selectedStoreIds.filter((id) => id !== storeRef));
                        }
                      }}
                    />
                    <label htmlFor={`hybrid-store-${storeRef}`} className="text-sm">
                      {entity.storeName}
                    </label>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStoresOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAddStores}>{t('hybridAddSelected')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCellDialogOpen} onOpenChange={setIsCellDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('hybridAssignUsersTitle')}</DialogTitle>
            <DialogDescription>
              {activeStoreId && activeProfileId
                ? `${getStoreName(activeStoreId)} • ${
                    profiles.find((profile) => profile.id === activeProfileId)?.name || t('hybridProfiles')
                  }`
                : t('hybridSelectUsersHint')}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 max-h-72 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('hybridNoUsersAvailable')}</p>
            ) : (
              users.map((user) => {
                const memberId = getUserPrimaryRef(user);
                return (
                  <div key={memberId} className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id={`hybrid-cell-user-${memberId}`}
                      checked={isUserSelectedForCell(user)}
                      onCheckedChange={(checked) => toggleCellUser(user, checked === true)}
                    />
                    <label htmlFor={`hybrid-cell-user-${memberId}`} className="text-sm">
                      {user.name}
                      {user.designation ? ` (${user.designation})` : ''}
                    </label>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCellDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveCell}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
