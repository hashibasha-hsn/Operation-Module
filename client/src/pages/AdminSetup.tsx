import { useState, useEffect } from "react";
import { GATEWAY } from "@/lib/apiConfig";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, CheckCircle, AlertCircle, Loader2, Circle } from "lucide-react";
import { useLocation } from "wouter";
import { validatePassword, getPasswordRuleResults, isPasswordValid } from "@/lib/passwordValidation";

const API_BASE = `${GATEWAY}/api/auth`;

export default function AdminSetup() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    organizationName: "",
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/check-setup`);
      const data = await response.json();
      
      if (data.isSetup) {
        setIsSetup(true);
        // Redirect to login if already set up
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error('Failed to check setup status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.organizationName) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/setup-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          organizationName: formData.organizationName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.message || 'Failed to set up admin');
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-sky-50/60">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (isSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-sky-50/60">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">System Already Set Up</h2>
            <p className="text-gray-600 mb-4">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-sky-50/60">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
            <p className="text-gray-600 mb-4">Admin account created successfully</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-sky-50/60 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center border border-primary/10">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Admin Setup
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Create your admin account to get started
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      id="organizationName"
                      type="text"
                      placeholder="Enter organization name"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Name of your organization</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Admin email address</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      id="password"
                      type="password"
                      placeholder="8+ chars, lowercase, number, special"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>8+ characters, 1 lowercase, 1 number, 1 special character</p>
                  </TooltipContent>
                </Tooltip>
                <ul className="space-y-1.5 rounded-lg border border-border/70 bg-muted/30 p-3">
                  {getPasswordRuleResults(formData.password).map((rule) => (
                    <li
                      key={rule.id}
                      className={`flex items-center gap-2 text-sm ${
                        rule.passed ? "text-emerald-600" : "text-muted-foreground"
                      }`}
                    >
                      {rule.passed ? (
                        <CheckCircle className="h-4 w-4 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0" />
                      )}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Re-enter password</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={
                      isSubmitting ||
                      !isPasswordValid(formData.password) ||
                      formData.password !== formData.confirmPassword
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Create Admin Account
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create admin account and complete setup</p>
                </TooltipContent>
              </Tooltip>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>This will create the first admin user with full system access</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
