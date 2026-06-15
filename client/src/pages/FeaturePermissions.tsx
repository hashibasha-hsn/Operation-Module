import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Save, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

// Taqtics 6-level role hierarchy
const TAQTICS_ROLES = [
  { id: 'company_admin', name: 'Company Admin', level: 1, description: 'Full system access' },
  { id: 'area_manager', name: 'Area Manager', level: 2, description: 'Regional oversight' },
  { id: 'process_manager', name: 'Process Manager', level: 3, description: 'Process management' },
  { id: 'user_manager', name: 'User Manager', level: 4, description: 'User administration' },
  { id: 'store_manager', name: 'Store Manager', level: 5, description: 'Store operations' },
  { id: 'store_employee', name: 'Store Employee', level: 6, description: 'Basic access' },
];

// Application features
const FEATURES = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊' },
  { id: 'tasks', name: 'Tasks', icon: '✅' },
  { id: 'process', name: 'Process', icon: '⚙️' },
  { id: 'audit', name: 'Audit', icon: '📋' },
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'assessments', name: 'Assessments', icon: '📝' },
  { id: 'attendance', name: 'Attendance', icon: '📅' },
  { id: 'notifications', name: 'Notifications', icon: '🔔' },
  { id: 'users', name: 'User Management', icon: '👥' },
  { id: 'admin', name: 'Admin Panel', icon: '🛡️' },
];

export default function FeaturePermissions() {
  const [, navigate] = useLocation();
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    initializePermissions();
  }, []);

  const initializePermissions = () => {
    // Initialize permissions with default Taqtics hierarchy
    const initialPermissions: Record<string, Record<string, boolean>> = {};
    
    TAQTICS_ROLES.forEach(role => {
      initialPermissions[role.id] = {};
      FEATURES.forEach(feature => {
        // Higher level roles have more permissions
        initialPermissions[role.id][feature.id] = role.level <= 3;
      });
    });
    
    setPermissions(initialPermissions);
    setIsLoading(false);
  };

  const togglePermission = (roleId: string, featureId: string) => {
    setPermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [featureId]: !prev[roleId][featureId],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setSaveSuccess(true);
    
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const goBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={goBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Go back</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Feature Permissions</h1>
              <p className="text-muted-foreground mt-1">Manage feature access by designation (Taqtics-style)</p>
            </div>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save permission changes</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Permission Matrix */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure which features each role can access based on Taqtics hierarchy
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold bg-gray-50 min-w-[200px]">
                    Role / Designation
                  </th>
                  {FEATURES.map(feature => (
                    <th key={feature.id} className="text-center p-3 font-semibold bg-gray-50 min-w-[100px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 cursor-help">
                            <span className="text-lg">{feature.icon}</span>
                            <span className="text-xs">{feature.name}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{feature.name} feature</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TAQTICS_ROLES.map((role, roleIndex) => (
                  <motion.tr
                    key={role.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: roleIndex * 0.1 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-semibold">{role.name}</div>
                        <div className="text-xs text-muted-foreground">Level {role.level}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </div>
                    </td>
                    {FEATURES.map(feature => (
                      <td key={feature.id} className="text-center p-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[role.id]?.[feature.id] || false}
                                onCheckedChange={() => togglePermission(role.id, feature.id)}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {permissions[role.id]?.[feature.id] 
                                ? `${role.name} can access ${feature.name}` 
                                : `${role.name} cannot access ${feature.name}`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TAQTICS_ROLES.map((role, index) => (
              <div key={role.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                  {role.level}
                </div>
                <div>
                  <div className="font-semibold">{role.name}</div>
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
