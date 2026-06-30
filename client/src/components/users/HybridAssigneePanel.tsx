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

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchHybridDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load hybrid assignee dashboard:', err);
      toast.error('Failed to load hybrid assignee data');
      setDashboard({
        stats: { activeStores: 0, profileCount: 0, maxProfiles: 15, totalAssignments: 0 },
        stores: [],
        profiles: [],
        cells: {},
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const getStoreName = useCallback(
    (storeId: string) =>
      entities.find((entity) => entity.id === storeId || entity.entityId === storeId)?.storeName ||
      storeId,
    [entities],
  );

  const getUserName = (userId: string) =>
    users.find((user) => (user.userId || user.id) === userId)?.name || userId;

  const filteredStores = useMemo(() => {
    if (!dashboard) return [];
    const query = storeSearch.trim().toLowerCase();
    return dashboard.stores.filter((store) => {
      if (!query) return true;
      return getStoreName(store.storeId).toLowerCase().includes(query);
    });
  }, [dashboard, storeSearch, getStoreName]);

  const availableStoresToAdd = useMemo(() => {
    const selected = new Set(dashboard?.stores.map((store) => store.storeId) || []);
    return entities.filter((entity) => !selected.has(entity.id));
  }, [dashboard, entities]);

  const openAddProfile = () => {
    setNewProfileName('');
    setIsAddProfileOpen(true);
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast.error('Profile name is required');
      return;
    }
    try {
      await createHybridProfile(newProfileName.trim());
      setIsAddProfileOpen(false);
      setNewProfileName('');
      await loadDashboard();
      toast.success('Profile created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create profile');
    }
  };

  const handleAddStores = async () => {
    if (selectedStoreIds.length === 0) {
      toast.error('Select at least one store');
      return;
    }
    try {
      const data = await addHybridStores(selectedStoreIds);
      setDashboard(data);
      setSelectedStoreIds([]);
      setIsAddStoresOpen(false);
      toast.success('Stores added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add stores');
    }
  };

  const handleRemoveStore = async (storeId: string) => {
    const storeName = getStoreName(storeId);
    if (!confirm(`Remove store "${storeName}" from hybrid assignee?`)) return;
    try {
      const data = await removeHybridStore(storeId);
      setDashboard(data);
      toast.success('Store removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove store');
    }
  };

  const openEditProfile = (profileId: string, name: string) => {
    setActiveProfileId(profileId);
    setEditProfileName(name);
    setIsEditProfileOpen(true);
  };

  const handleRenameProfile = async () => {
    if (!activeProfileId || !editProfileName.trim()) {
      toast.error('Profile name is required');
      return;
    }
    try {
      await renameHybridProfile(activeProfileId, editProfileName.trim());
      setIsEditProfileOpen(false);
      await loadDashboard();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handlePublishProfile = async (profileId: string) => {
    try {
      await publishHybridProfile(profileId);
      await loadDashboard();
      toast.success('Profile published');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish profile');
    }
  };

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
    if (!confirm(`Delete profile "${profileName}"?`)) return;
    try {
      await deleteHybridProfile(profileId);
      await loadDashboard();
      toast.success('Profile deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  const openCellDialog = (storeId: string, profileId: string) => {
    const key = buildHybridCellKey(storeId, profileId);
    setActiveStoreId(storeId);
    setActiveProfileId(profileId);
    setSelectedCellUserIds(dashboard?.cells[key] ? [...dashboard.cells[key]] : []);
    setIsCellDialogOpen(true);
  };

  const handleSaveCell = async () => {
    if (!activeProfileId || !activeStoreId) return;
    try {
      const data = await updateHybridCell(activeProfileId, activeStoreId, selectedCellUserIds);
      setDashboard(data);
      setIsCellDialogOpen(false);
      toast.success('Assignments saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save assignments');
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
      return 'No data';
    }
    if (stores.length === 0) {
      return 'Add store(s) to build the assignment matrix';
    }
    if (profiles.length === 0) {
      return 'Add a profile column to assign users';
    }
    if (filteredStores.length === 0) {
      return 'No stores match your search';
    }
    return 'No data';
  }, [profiles.length, stores.length, filteredStores.length]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold tracking-wide text-sky-700 uppercase">
            Hybrid Assignee Profile
          </h2>
          <p className="text-sm text-muted-foreground max-w-3xl mt-1">
            Manage stores, profiles, and user assignments for workflow automation.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0 bg-background"
          onClick={openAddProfile}
          disabled={!canAddProfile}
        >
          <FilePlus2 className="w-4 h-4" />
          Create
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          value={stats.activeStores}
          label="Stores"
          badge="Active"
          badgeClassName="bg-blue-100 text-blue-700 hover:bg-blue-100"
        />
        <StatCard
          value={`${stats.profileCount}/${stats.maxProfiles}`}
          label="Profiles"
          badge="Configured"
          badgeClassName="bg-pink-100 text-pink-700 hover:bg-pink-100"
        />
        <StatCard
          value={stats.totalAssignments}
          label="Total Assignments"
          badge="Users"
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
          Add Store(s)
        </Button>
        <Button className="gap-2" onClick={openAddProfile} disabled={!canAddProfile}>
          <Plus className="w-4 h-4" />
          Add Profile
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[240px]">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Store Name</span>
                    <div className="relative w-full max-w-[180px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search"
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
                          {profile.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <TableActionsMenu align="end">
                        <DropdownMenuItem onClick={() => openEditProfile(profile.id, profile.name)}>
                          {t('edit')}
                        </DropdownMenuItem>
                        {!profile.isPublished && (
                          <DropdownMenuItem onClick={() => handlePublishProfile(profile.id)}>
                            Publish
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
                    Loading...
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
                          Add Store(s)
                        </Button>
                      )}
                      {profiles.length === 0 && stores.length === 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                          <Button variant="outline" size="sm" onClick={openAddProfile} disabled={!canAddProfile}>
                            Add Profile
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStoreIds([]);
                              setIsAddStoresOpen(true);
                            }}
                          >
                            Add Store(s)
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
                        Add a profile to assign users
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
                                <span className="text-xs text-muted-foreground">Assign users</span>
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
            <DialogTitle>Add Profile</DialogTitle>
            <DialogDescription>
              Create a hybrid assignee profile column (max {stats.maxProfiles} profiles).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hybridProfileName">Profile Name</Label>
              <Input
                id="hybridProfileName"
                placeholder="e.g., Operations Team"
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
            <DialogDescription>Rename this hybrid assignee profile.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editHybridProfileName">Profile Name</Label>
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
            <DialogTitle>Add Store(s)</DialogTitle>
            <DialogDescription>Select stores to include in the hybrid assignee matrix.</DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 max-h-72 overflow-y-auto">
            {availableStoresToAdd.length === 0 ? (
              <p className="text-sm text-muted-foreground">All stores are already added.</p>
            ) : (
              availableStoresToAdd.map((entity) => (
                <div key={entity.id} className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id={`hybrid-store-${entity.id}`}
                    checked={selectedStoreIds.includes(entity.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStoreIds([...selectedStoreIds, entity.id]);
                      } else {
                        setSelectedStoreIds(selectedStoreIds.filter((id) => id !== entity.id));
                      }
                    }}
                  />
                  <label htmlFor={`hybrid-store-${entity.id}`} className="text-sm">
                    {entity.storeName}
                  </label>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStoresOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleAddStores}>Add Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCellDialogOpen} onOpenChange={setIsCellDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Users</DialogTitle>
            <DialogDescription>
              {activeStoreId && activeProfileId
                ? `${getStoreName(activeStoreId)} • ${
                    profiles.find((profile) => profile.id === activeProfileId)?.name || 'Profile'
                  }`
                : 'Select users for this store and profile.'}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 max-h-72 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users available</p>
            ) : (
              users.map((user) => {
                const memberId = user.userId || user.id;
                return (
                  <div key={memberId} className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id={`hybrid-cell-user-${memberId}`}
                      checked={selectedCellUserIds.includes(memberId)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCellUserIds([...selectedCellUserIds, memberId]);
                        } else {
                          setSelectedCellUserIds(selectedCellUserIds.filter((id) => id !== memberId));
                        }
                      }}
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
