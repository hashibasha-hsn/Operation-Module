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
  const [processTags, setProcessTags] = useState<any[]>([]);
  const [questionTags, setQuestionTags] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [isAdvTagDialogOpen, setIsAdvTagDialogOpen] = useState(false);
  const [isAssigneeDialogOpen, setIsAssigneeDialogOpen] = useState(false);
  const [isProcessTagDialogOpen, setIsProcessTagDialogOpen] = useState(false);
  const [isQuestionTagDialogOpen, setIsQuestionTagDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [advTagData, setAdvTagData] = useState({
    rootTagName: "",
    values: [] as string[],
  });
  const [assigneeData, setAssigneeData] = useState({
    profileName: "",
    storeIds: [] as string[],
  });
  const [editingAssigneeProfile, setEditingAssigneeProfile] = useState<any>(null);
  const [isViewStoresDialogOpen, setIsViewStoresDialogOpen] = useState(false);
  const [viewingProfileStores, setViewingProfileStores] = useState<any>(null);
  const [processTagData, setProcessTagData] = useState({
    tagName: "",
    ownerName: "",
  });
  const [editingProcessTag, setEditingProcessTag] = useState<any>(null);
  const [questionTagData, setQuestionTagData] = useState({
    tagName: "",
    values: [] as string[],
  });
  const [editingQuestionTag, setEditingQuestionTag] = useState<any>(null);

  useEffect(() => {
    fetchAdvDropdownTags();
    fetchAssigneeProfiles();
    fetchProcessTags();
    fetchQuestionTags();
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

  const fetchProcessTags = async () => {
    try {
      const response = await fetch('http://localhost:3002/tags/process?organizationId=default-org');
      const data = await response.json();
      console.log('Fetched process tags data:', data);
      // Handle both array and object responses
      const tagsArray = Array.isArray(data) ? data : (data?.tags || []);
      console.log('Setting process tags:', tagsArray);
      setProcessTags(tagsArray);
    } catch (err) {
      console.error('Failed to fetch process tags:', err);
      setProcessTags([]);
    }
  };

  const fetchQuestionTags = async () => {
    try {
      const response = await fetch('http://localhost:3002/tags/question?organizationId=default-org');
      const data = await response.json();
      // Handle both array and object responses
      const tagsArray = Array.isArray(data) ? data : (data?.tags || []);
      setQuestionTags(tagsArray);
    } catch (err) {
      console.error('Failed to fetch question tags:', err);
      setQuestionTags([]);
    }
  };

  const handleCreateAdvTag = async () => {
    try {
      // Transform string array to object array for backend
      const valuesArray = advTagData.values.map((value) => ({ value }));
      
      const response = await fetch('http://localhost:3002/tags/adv-dropdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rootTagName: advTagData.rootTagName,
          values: valuesArray,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setAdvTagData({ rootTagName: "", values: [] });
        setIsAdvTagDialogOpen(false);
        fetchAdvDropdownTags();
      } else {
        console.error('Failed to create adv dropdown tag');
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (err) {
      console.error('Error creating adv dropdown tag:', err);
    }
  };

  const handleCreateAssigneeProfile = async () => {
    try {
      const url = editingAssigneeProfile 
        ? `http://localhost:3002/tags/assignee-profile/${editingAssigneeProfile.id}`
        : 'http://localhost:3002/tags/assignee-profile';
      
      const method = editingAssigneeProfile ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...assigneeData,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setAssigneeData({ profileName: "", storeIds: [] });
        setEditingAssigneeProfile(null);
        setIsAssigneeDialogOpen(false);
        fetchAssigneeProfiles();
      } else {
        console.error('Failed to save assignee profile');
      }
    } catch (err) {
      console.error('Error saving assignee profile:', err);
    }
  };

  const handleEditAssigneeProfile = (profile: any) => {
    setEditingAssigneeProfile(profile);
    setAssigneeData({
      profileName: profile.profileName,
      storeIds: profile.storeIds || [],
    });
    setIsAssigneeDialogOpen(true);
  };

  const handleViewStores = (profile: any) => {
    setViewingProfileStores(profile);
    setIsViewStoresDialogOpen(true);
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

  const handleCreateProcessTag = async () => {
    try {
      const url = editingProcessTag 
        ? `http://localhost:3002/tags/process/${editingProcessTag.id}`
        : 'http://localhost:3002/tags/process';
      
      const method = editingProcessTag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...processTagData,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setProcessTagData({ tagName: "", ownerName: "" });
        setEditingProcessTag(null);
        setIsProcessTagDialogOpen(false);
        fetchProcessTags();
      } else {
        console.error('Failed to save process tag');
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (err) {
      console.error('Error saving process tag:', err);
    }
  };

  const handleEditProcessTag = (tag: any) => {
    setEditingProcessTag(tag);
    setProcessTagData({
      tagName: tag.tagName,
      ownerName: tag.ownerName,
    });
    setIsProcessTagDialogOpen(true);
  };

  const handleDeleteProcessTag = async (id: string) => {
    if (!confirm(t('areYouSureYouWantToDeleteThisTag'))) return;

    try {
      await fetch(`http://localhost:3002/tags/process/${id}`, {
        method: 'DELETE',
      });
      fetchProcessTags();
    } catch (err) {
      console.error('Error deleting process tag:', err);
    }
  };

  const handleCreateQuestionTag = async () => {
    try {
      const url = editingQuestionTag 
        ? `http://localhost:3002/tags/question/${editingQuestionTag.id}`
        : 'http://localhost:3002/tags/question';
      
      const method = editingQuestionTag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...questionTagData,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setQuestionTagData({ tagName: "", values: [] });
        setEditingQuestionTag(null);
        setIsQuestionTagDialogOpen(false);
        fetchQuestionTags();
      } else {
        console.error('Failed to save question tag');
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (err) {
      console.error('Error saving question tag:', err);
    }
  };

  const handleEditQuestionTag = (tag: any) => {
    setEditingQuestionTag(tag);
    setQuestionTagData({
      tagName: tag.tagName,
      values: tag.values || [],
    });
    setIsQuestionTagDialogOpen(true);
  };

  const handleDeleteQuestionTag = async (id: string) => {
    if (!confirm(t('areYouSureYouWantToDeleteThisTag'))) return;

    try {
      await fetch(`http://localhost:3002/tags/question/${id}`, {
        method: 'DELETE',
      });
      fetchQuestionTags();
    } catch (err) {
      console.error('Error deleting question tag:', err);
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
            {[t('advDropdownTag'), t('assigneeProfile'), t('processTag'), t('questionTag')].map((tab) => (
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
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('searchTags')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
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
                    <TableHead>{t('tag')}</TableHead>
                    <TableHead>{t('tagValue')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advDropdownTags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                        {t('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    advDropdownTags
                      .filter((tag: any) => 
                        tag.rootTagName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        tag.values?.some((v: any) => v.value?.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((tag: any) => (
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
      ) : activeTab === t('assigneeProfile') ? (
        <>
          {/* Assignee Profile Content */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('searchTags')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Dialog open={isAssigneeDialogOpen} onOpenChange={setIsAssigneeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('createNewProfile')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAssigneeProfile ? t('editAssigneeProfile') : t('createAssigneeProfile')}</DialogTitle>
                  <DialogDescription>
                    {editingAssigneeProfile ? t('updateAssigneeProfile') : t('createProfileWithAssignedStores')}
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
                    <TableHead>{t('tag')}</TableHead>
                    <TableHead>{t('tagValue')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assigneeProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                        {t('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    assigneeProfiles
                      .filter((profile: any) => 
                        profile.profileName?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((profile: any) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.profileName}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">{profile.storeIds?.length || 0} {t('stores')}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewStores(profile)}>
                              <Building2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditAssigneeProfile(profile)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAssigneeProfile(profile.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* View Stores Dialog */}
          <Dialog open={isViewStoresDialogOpen} onOpenChange={setIsViewStoresDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('assignedStores')}</DialogTitle>
                <DialogDescription>
                  {t('storesAssignedToProfile').replace('{{profileName}}', viewingProfileStores?.profileName || '')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                  {viewingProfileStores?.storeIds?.length > 0 ? (
                    entities
                      .filter((entity: any) => viewingProfileStores.storeIds.includes(entity.id))
                      .map((entity: any) => (
                        <div key={entity.id} className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{entity.storeName}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('noStoresAssigned')}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsViewStoresDialogOpen(false)}>
                  {t('close')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : activeTab === t('processTag') ? (
        <>
          {/* Process Tag Content */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('searchTags')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Dialog open={isProcessTagDialogOpen} onOpenChange={setIsProcessTagDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('createTag')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingProcessTag ? t('editTag') : t('createTag')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tagName">
                      {t('tagName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tagName"
                      placeholder={t('enterTagName')}
                      value={processTagData.tagName}
                      onChange={(e) => setProcessTagData({ ...processTagData, tagName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ownerName">
                      {t('ownerName')} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={processTagData.ownerName}
                      onValueChange={(value) => setProcessTagData({ ...processTagData, ownerName: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectOwner')} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.userId} value={user.name}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {setIsProcessTagDialogOpen(false); setEditingProcessTag(null);}}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleCreateProcessTag}>
                    {editingProcessTag ? t('save') : t('createTag')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Process Tags Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tag')}</TableHead>
                    <TableHead>{t('ownerName')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processTags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                        {t('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    processTags
                      .filter((tag: any) => 
                        tag.tagName?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((tag: any) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.tagName}</TableCell>
                        <TableCell>
                          {tag.ownerName || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditProcessTag(tag)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteProcessTag(tag.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
          {/* Question Tag Content */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('searchTags')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Dialog open={isQuestionTagDialogOpen} onOpenChange={setIsQuestionTagDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('createTag')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingQuestionTag ? t('editTag') : t('createTag')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="questionTagName">
                      {t('tagName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="questionTagName"
                      placeholder={t('enterTagName')}
                      value={questionTagData.tagName}
                      onChange={(e) => setQuestionTagData({ ...questionTagData, tagName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tagValues">{t('tagValue')}</Label>
                    <div className="space-y-2">
                      {questionTagData.values.map((value, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Value ${index + 1}`}
                            value={value}
                            onChange={(e) => {
                              const newValues = [...questionTagData.values];
                              newValues[index] = e.target.value;
                              setQuestionTagData({ ...questionTagData, values: newValues });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newValues = questionTagData.values.filter((_, i) => i !== index);
                              setQuestionTagData({ ...questionTagData, values: newValues });
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
                        onClick={() => setQuestionTagData({ ...questionTagData, values: [...questionTagData.values, "" ] })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('addValue')}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {setIsQuestionTagDialogOpen(false); setEditingQuestionTag(null);}}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleCreateQuestionTag}>
                    {editingQuestionTag ? t('save') : t('createTag')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Question Tags Table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tag')}</TableHead>
                    <TableHead>{t('tagValue')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionTags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                        {t('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    questionTags
                      .filter((tag: any) => 
                        tag.tagName?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((tag: any) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.tagName}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tag.values?.map((value: string, index: number) => (
                              <Badge key={index} variant="outline">{value}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditQuestionTag(tag)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestionTag(tag.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
