import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Tag, Users, ChevronDown, Edit, Trash2, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Tags() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(t('advDropdownTag'));
  const [advDropdownTags, setAdvDropdownTags] = useState<any[]>([]);
  const [assigneeProfiles, setAssigneeProfiles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [isAdvTagDialogOpen, setIsAdvTagDialogOpen] = useState(false);
  const [isAssigneeDialogOpen, setIsAssigneeDialogOpen] = useState(false);
  const [advTagData, setAdvTagData] = useState({
    rootTagName: "",
    values: [] as string[],
  });
  const [assigneeData, setAssigneeData] = useState({
    profileName: "",
    storeIds: [] as string[],
    userIds: [] as string[],
  });

  useEffect(() => {
    fetchAdvDropdownTags();
    fetchAssigneeProfiles();
    fetchUsers();
    fetchEntities();
  }, []);

  const fetchAdvDropdownTags = async () => {
    try {
      const response = await fetch('http://localhost:3002/tags/adv-dropdown?organizationId=default-org');
      const data = await response.json();
      setAdvDropdownTags(data || []);
    } catch (err) {
      console.error('Failed to fetch adv dropdown tags:', err);
    }
  };

  const fetchAssigneeProfiles = async () => {
    try {
      const response = await fetch('http://localhost:3002/tags/assignee-profile?organizationId=default-org');
      const data = await response.json();
      setAssigneeProfiles(data || []);
    } catch (err) {
      console.error('Failed to fetch assignee profiles:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3002/users?organizationId=default-org');
      const data = await response.json();
      // Handle both array and object responses
      const usersArray = Array.isArray(data) ? data : (data?.users || []);
      setUsers(usersArray);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    }
  };

  const fetchEntities = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/org/entities?organizationId=default-org');
      const data = await response.json();
      setEntities(data || []);
    } catch (err) {
      console.error('Failed to fetch entities:', err);
    }
  };

  const handleCreateAdvTag = async () => {
    try {
      const response = await fetch('http://localhost:3002/tags/adv-dropdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...advTagData,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setAdvTagData({ rootTagName: "", values: [] });
        setIsAdvTagDialogOpen(false);
        fetchAdvDropdownTags();
      } else {
        console.error('Failed to create adv dropdown tag');
      }
    } catch (err) {
      console.error('Error creating adv dropdown tag:', err);
    }
  };

  const handleCreateAssigneeProfile = async () => {
    try {
      const response = await fetch('http://localhost:3002/tags/assignee-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...assigneeData,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setAssigneeData({ profileName: "", storeIds: [], userIds: [] });
        setIsAssigneeDialogOpen(false);
        fetchAssigneeProfiles();
      } else {
        console.error('Failed to create assignee profile');
      }
    } catch (err) {
      console.error('Error creating assignee profile:', err);
    }
  };

  const handleDeleteAdvTag = async (id: string) => {
    if (!confirm(t('areYouSureYouWantToDeleteThisTag'))) return;

    try {
      await fetch(`http://localhost:3002/tags/adv-dropdown/${id}`, {
        method: 'DELETE',
      });
      fetchAdvDropdownTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
    }
  };

  const handleDeleteAssigneeProfile = async (id: string) => {
    if (!confirm(t('areYouSureYouWantToDeleteThisProfile'))) return;

    try {
      await fetch(`http://localhost:3002/tags/assignee-profile/${id}`, {
        method: 'DELETE',
      });
      fetchAssigneeProfiles();
    } catch (err) {
      console.error('Error deleting profile:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t('manageTags')}</h1>
            <p className="text-muted-foreground mt-1">{t('organizeAndAutomateActionsWithTags')}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-card">
        <div className="px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[t('advDropdownTag'), t('assigneeProfile')].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                className={`rounded-t-lg border-b-2 ${
                  activeTab === tab
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === t('advDropdownTag') ? (
        <>
          {/* Adv Dropdown Tag Content */}
          <div className="flex items-center justify-between mb-6">
            <Dialog open={isAdvTagDialogOpen} onOpenChange={setIsAdvTagDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('createTag')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('createAdvancedDropdownTag')}</DialogTitle>
                  <DialogDescription>
                    {t('createDropdownTagWithMultipleValues')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rootTagName">
                      {t('rootTagName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="rootTagName"
                      placeholder="e.g., Supplier, Zone, Region"
                      value={advTagData.rootTagName}
                      onChange={(e) => setAdvTagData({ ...advTagData, rootTagName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="values">{t('dropdownValues')}</Label>
                    <div className="space-y-2">
                      {advTagData.values.map((value, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Value ${index + 1}`}
                            value={value}
                            onChange={(e) => {
                              const newValues = [...advTagData.values];
                              newValues[index] = e.target.value;
                              setAdvTagData({ ...advTagData, values: newValues });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newValues = advTagData.values.filter((_, i) => i !== index);
                              setAdvTagData({ ...advTagData, values: newValues });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setAdvTagData({ ...advTagData, values: [...advTagData.values, ""] })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('addValue')}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAdvTagDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleCreateAdvTag}>
                    {t('createTag')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Adv Dropdown Tags Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('rootTagName')}</TableHead>
                    <TableHead>{t('values')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advDropdownTags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        {t('noAdvancedDropdownTagsAvailable')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    advDropdownTags.map((tag: any) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.rootTagName}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tag.values?.map((value: any) => (
                              <Badge key={value.id} variant="outline">
                                {value.value}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tag.isActive ? "default" : "secondary"}>
                            {tag.isActive ? t('active') : t('inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAdvTag(tag.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Assignee Profile Content */}
          <div className="flex items-center justify-between mb-6">
            <Dialog open={isAssigneeDialogOpen} onOpenChange={setIsAssigneeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('createNewProfile')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('createAssigneeProfile')}</DialogTitle>
                  <DialogDescription>
                    {t('createProfileWithAssignedStoresAndUsers')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="profileName">
                      {t('profileName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="profileName"
                      placeholder="e.g., North Zone Ops, VM Leads"
                      value={assigneeData.profileName}
                      onChange={(e) => setAssigneeData({ ...assigneeData, profileName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('selectStores')}</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {entities.map((entity: any) => (
                        <div key={entity.id} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`store-${entity.id}`}
                            checked={assigneeData.storeIds.includes(entity.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssigneeData({
                                  ...assigneeData,
                                  storeIds: [...assigneeData.storeIds, entity.id],
                                });
                              } else {
                                setAssigneeData({
                                  ...assigneeData,
                                  storeIds: assigneeData.storeIds.filter((id) => id !== entity.id),
                                });
                              }
                            }}
                          />
                          <label htmlFor={`store-${entity.id}`} className="text-sm">
                            {entity.storeName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('selectUsers')}</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {users.map((user: any) => (
                        <div key={user.userId} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={`user-${user.userId}`}
                            checked={assigneeData.userIds.includes(user.userId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssigneeData({
                                  ...assigneeData,
                                  userIds: [...assigneeData.userIds, user.userId],
                                });
                              } else {
                                setAssigneeData({
                                  ...assigneeData,
                                  userIds: assigneeData.userIds.filter((id) => id !== user.userId),
                                });
                              }
                            }}
                          />
                          <label htmlFor={`user-${user.userId}`} className="text-sm">
                            {user.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssigneeDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleCreateAssigneeProfile}>
                    {t('saveProfile')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Assignee Profiles Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('profileName')}</TableHead>
                    <TableHead>{t('stores')}</TableHead>
                    <TableHead>{t('users')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assigneeProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        {t('noAssigneeProfilesAvailable')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    assigneeProfiles.map((profile: any) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.profileName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{profile.storeIds?.length || 0} {t('stores')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{profile.users?.length || 0} {t('users')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={profile.isActive ? "default" : "secondary"}>
                            {profile.isActive ? t('active') : t('inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAssigneeProfile(profile.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
