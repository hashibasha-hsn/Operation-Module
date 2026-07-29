import { useState, useEffect } from "react";
import { GATEWAY } from "@/lib/apiConfig";
import { getStoredUser } from "@/lib/authStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Save,
  ArrowRight,
  Settings,
  Users,
  FileText,
  Clock,
  Bell,
  CheckCircle,
} from "lucide-react";
import { useLocation } from "wouter";

export default function AuditSetup() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"basic" | "build" | "properties" | "assign">("basic");
  const [auditId, setAuditId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [processTag, setProcessTag] = useState("");

  // Properties
  const [status, setStatus] = useState("draft");
  const [frequency, setFrequency] = useState("custom");
  const [occurrence, setOccurrence] = useState<"one-time" | "recurring">("one-time");
  const [responsesAfterEndTime, setResponsesAfterEndTime] = useState<"accept" | "reject">("accept");
  const [numberOfResponses, setNumberOfResponses] = useState<"one" | "multiple">("one");
  const [submissionBy, setSubmissionBy] = useState<"anyone" | "everyone">("anyone");
  const [dateRangeSelection, setDateRangeSelection] = useState<"allowed" | "restricted">("allowed");
  const [passThreshold, setPassThreshold] = useState(80);
  const [reviewLevels, setReviewLevels] = useState(1);

  // Assignment
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // Build tab state
  const [sections, setSections] = useState<any[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("text");
  const [newQuestionOptions, setNewQuestionOptions] = useState("");
  const [newQuestionRequired, setNewQuestionRequired] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user.organizationId) {
      // Load available users and stores
      loadAvailableData(user.organizationId);
    }
  }, []);

  const loadAvailableData = async (organizationId: string) => {
    try {
      // Load users
      const usersResponse = await fetch(`${GATEWAY}/api/user?organizationId=${organizationId}`);
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        setAvailableUsers(users);
      }

      // Load stores (assuming there's an endpoint for this)
      const storesResponse = await fetch(`${GATEWAY}/api/org/stores?organizationId=${organizationId}`);
      if (storesResponse.ok) {
        const stores = await storesResponse.json();
        setAvailableStores(stores);
      }
    } catch (error) {
      console.error("Error loading available data:", error);
    }
  };

  const handleCreateAudit = async () => {
    setLoading(true);
    try {
      const user = getStoredUser();
      const response = await fetch(`${GATEWAY}/api/audits/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          processTag,
          organizationId: user.organizationId,
          createdBy: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuditId(data.id);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorData = await response.json();
        console.error("Error creating audit:", errorData);
        alert("Failed to create audit: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error creating audit:", error);
      alert("Failed to create audit. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!title.trim()) {
      alert("Please enter a title for the audit");
      return;
    }
    
    if (!auditId) {
      await handleCreateAudit();
    } else {
      setLoading(true);
      try {
        const response = await fetch(`${GATEWAY}/api/audits/${auditId}/basic-info`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, processTag }),
        });
        
        if (response.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } else {
          const errorData = await response.json();
          console.error("Error saving basic info:", errorData);
          alert("Failed to save: " + (errorData.message || "Unknown error"));
        }
      } catch (error) {
        console.error("Error saving basic info:", error);
        alert("Failed to save. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveProperties = async () => {
    if (!auditId) return;
    setLoading(true);
    try {
      await fetch(`${GATEWAY}/api/audits/${auditId}/properties`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          frequency,
          occurrence,
          responsesAfterEndTime,
          numberOfResponses,
          submissionBy,
          dateRangeSelection,
          passThreshold,
          reviewLevels,
        }),
      });
      setSaved(true);
    } catch (error) {
      console.error("Error saving properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!auditId) return;
    setLoading(true);
    try {
      await fetch(`${GATEWAY}/api/audits/${auditId}/assignment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeIds, storeIds }),
      });
      setSaved(true);
    } catch (error) {
      console.error("Error saving assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!auditId) return;
    setLoading(true);
    try {
      await fetch(`${GATEWAY}/api/audits/${auditId}/publish`, {
        method: "PUT",
      });
      navigate("/audit");
    } catch (error) {
      console.error("Error publishing audit:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionTitle.trim() || !auditId) return;
    setLoading(true);
    try {
      const response = await fetch(`${GATEWAY}/api/audits/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSectionTitle,
          description: newSectionDescription,
          auditId,
          displayOrder: sections.length,
        }),
      });

      if (response.ok) {
        const section = await response.json();
        setSections([...sections, { ...section, questions: [] }]);
        setNewSectionTitle("");
        setNewSectionDescription("");
        setShowAddSection(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error adding section:", error);
      alert("Failed to add section");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestionText.trim() || !selectedSectionId || !auditId) return;
    setLoading(true);
    try {
      const options = newQuestionType === "multiple_choice" || newQuestionType === "dropdown" 
        ? newQuestionOptions.split(",").map(o => o.trim())
        : null;

      const response = await fetch(`${GATEWAY}/api/audits/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: newQuestionText,
          questionType: newQuestionType,
          options,
          isRequired: newQuestionRequired,
          sectionId: selectedSectionId,
          displayOrder: sections.find(s => s.id === selectedSectionId)?.questions?.length || 0,
        }),
      });

      if (response.ok) {
        const question = await response.json();
        setSections(sections.map(section => {
          if (section.id === selectedSectionId) {
            return {
              ...section,
              questions: [...(section.questions || []), question]
            };
          }
          return section;
        }));
        setNewQuestionText("");
        setNewQuestionType("text");
        setNewQuestionOptions("");
        setNewQuestionRequired(false);
        setShowAddQuestion(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      await fetch(`${GATEWAY}/api/audits/sections/${sectionId}`, {
        method: "DELETE",
      });
      setSections(sections.filter(s => s.id !== sectionId));
    } catch (error) {
      console.error("Error deleting section:", error);
      alert("Failed to delete section");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await fetch(`${GATEWAY}/api/audits/questions/${questionId}`, {
        method: "DELETE",
      });
      setSections(sections.map(section => ({
        ...section,
        questions: section.questions?.filter((q: any) => q.id !== questionId) || []
      })));
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question");
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans antialiased">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Set Up Your Audit</h1>
          <p className="text-gray-600 mt-3 text-lg leading-relaxed font-medium">
            Create and configure your audit with questions, properties, and assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Saved</span>
            </div>
          )}
          <Button onClick={handlePublish} className="bg-sky-600 hover:bg-sky-700">
            Publish Audit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-transparent border-b rounded-none h-auto p-0">
          <TabsTrigger
            value="basic"
            className="data-[state=active]:border-b-2 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-gray-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger
            value="build"
            className="data-[state=active]:border-b-2 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-gray-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Build
          </TabsTrigger>
          <TabsTrigger
            value="properties"
            className="data-[state=active]:border-b-2 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Properties
          </TabsTrigger>
          <TabsTrigger
            value="assign"
            className="data-[state=active]:border-b-2 data-[state=active]:border-sky-500 data-[state=active]:text-sky-600 data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-gray-50"
          >
            <Users className="w-4 h-4 mr-2" />
            Assign
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 font-semibold text-sm">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter audit title"
                  className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-semibold text-sm">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter audit description"
                  rows={4}
                  className="border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="processTag" className="text-gray-700 font-semibold text-sm">
                  Process Tag
                </Label>
                <Input
                  id="processTag"
                  value={processTag}
                  onChange={(e) => setProcessTag(e.target.value)}
                  placeholder="Enter process tag for categorization"
                  className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBasicInfo} disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save & Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Build Tab */}
        <TabsContent value="build" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Build Your Audit</CardTitle>
                <Button onClick={() => setShowAddSection(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sections.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">Add Questions to Your Audit</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Create sections and add questions to build your audit form
                  </p>
                  <Button onClick={() => setShowAddSection(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Section
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section: any) => (
                    <Card key={section.id} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                            {section.description && (
                              <p className="text-gray-500 text-sm">{section.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSectionId(section.id);
                                setShowAddQuestion(true);
                              }}
                              className="gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add Question
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSection(section.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {section.questions && section.questions.length > 0 ? (
                          <div className="space-y-2">
                            {section.questions.map((question: any) => (
                              <div
                                key={question.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {question.questionText}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Type: {question.questionType} • Required: {question.isRequired ? "Yes" : "No"}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Delete
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No questions added yet</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Section Dialog */}
          {showAddSection && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Add Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Section Title *</Label>
                    <Input
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="Enter section title"
                      className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Description</Label>
                    <Textarea
                      value={newSectionDescription}
                      onChange={(e) => setNewSectionDescription(e.target.value)}
                      placeholder="Enter section description"
                      rows={3}
                      className="border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddSection(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSection} disabled={loading}>
                      {loading ? "Adding..." : "Add Section"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add Question Dialog */}
          {showAddQuestion && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Add Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Question Text *</Label>
                    <Textarea
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Enter your question"
                      rows={3}
                      className="border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Question Type</Label>
                    <Select value={newQuestionType} onValueChange={setNewQuestionType}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="yes_no">Yes/No</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="file">File</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(newQuestionType === "multiple_choice" || newQuestionType === "dropdown") && (
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold text-sm">Options (comma-separated)</Label>
                      <Input
                        value={newQuestionOptions}
                        onChange={(e) => setNewQuestionOptions(e.target.value)}
                        placeholder="Option 1, Option 2, Option 3"
                        className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required"
                      checked={newQuestionRequired}
                      onCheckedChange={(checked) => setNewQuestionRequired(checked as boolean)}
                    />
                    <Label htmlFor="required" className="text-sm text-gray-700 cursor-pointer">
                      Required question
                    </Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddQuestion(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddQuestion} disabled={loading}>
                      {loading ? "Adding..." : "Add Question"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Audit Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Audit Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Occurrence</Label>
                    <Select value={occurrence} onValueChange={(value: any) => setOccurrence(value)}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Responses After End-Time</Label>
                    <Select value={responsesAfterEndTime} onValueChange={(value: any) => setResponsesAfterEndTime(value)}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accept">Accept</SelectItem>
                        <SelectItem value="reject">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Number of Responses</Label>
                    <Select value={numberOfResponses} onValueChange={(value: any) => setNumberOfResponses(value)}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one">One response per user</SelectItem>
                        <SelectItem value="multiple">Multiple responses per user</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Submission By</Label>
                    <Select value={submissionBy} onValueChange={(value: any) => setSubmissionBy(value)}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anyone">Anyone</SelectItem>
                        <SelectItem value="everyone">Everyone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Date Range Selection</Label>
                    <Select value={dateRangeSelection} onValueChange={(value: any) => setDateRangeSelection(value)}>
                      <SelectTrigger className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allowed">Allowed</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Scoring Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Scoring Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Pass Threshold (%)</Label>
                    <Input
                      type="number"
                      value={passThreshold}
                      onChange={(e) => setPassThreshold(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold text-sm">Review Levels</Label>
                    <Input
                      type="number"
                      value={reviewLevels}
                      onChange={(e) => setReviewLevels(Number(e.target.value))}
                      min="1"
                      max="5"
                      className="h-12 border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProperties} disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Properties"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assign Tab */}
        <TabsContent value="assign" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Assign by Stores */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Assign by Stores</h3>
                  <Button onClick={() => setShowStoreSelector(true)} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Stores
                  </Button>
                </div>
                {storeIds.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">No stores selected</p>
                    <p className="text-gray-500 text-sm">
                      Select stores where this audit should be assigned
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableStores.filter((store: any) => storeIds.includes(store.id)).map((store: any) => (
                      <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{store.name}</p>
                          <p className="text-xs text-gray-500">{store.location || "No location"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setStoreIds(storeIds.filter(id => id !== store.id))}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign by Users */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Assign by Users</h3>
                  <Button onClick={() => setShowUserSelector(true)} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Users
                  </Button>
                </div>
                {assigneeIds.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">No users selected</p>
                    <p className="text-gray-500 text-sm">
                      Select users who should complete this audit
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.filter((user: any) => assigneeIds.includes(user.id)).map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAssigneeIds(assigneeIds.filter(id => id !== user.id))}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAssignment} disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Assignment"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Store Selector Dialog */}
          {showStoreSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
                <CardHeader>
                  <CardTitle>Select Stores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto max-h-[60vh]">
                  {availableStores.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No stores available</p>
                  ) : (
                    <div className="space-y-2">
                      {availableStores.map((store: any) => (
                        <div key={store.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={`store-${store.id}`}
                            checked={storeIds.includes(store.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setStoreIds([...storeIds, store.id]);
                              } else {
                                setStoreIds(storeIds.filter(id => id !== store.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`store-${store.id}`} className="cursor-pointer">
                              <p className="text-sm font-medium text-gray-900">{store.name}</p>
                              <p className="text-xs text-gray-500">{store.location || "No location"}</p>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowStoreSelector(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowStoreSelector(false)}>
                      Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Selector Dialog */}
          {showUserSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
                <CardHeader>
                  <CardTitle>Select Users</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto max-h-[60vh]">
                  {availableUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No users available</p>
                  ) : (
                    <div className="space-y-2">
                      {availableUsers.map((user: any) => (
                        <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={assigneeIds.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAssigneeIds([...assigneeIds, user.id]);
                              } else {
                                setAssigneeIds(assigneeIds.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`user-${user.id}`} className="cursor-pointer">
                              <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowUserSelector(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowUserSelector(false)}>
                      Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
