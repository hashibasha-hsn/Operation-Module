import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { AUTH_API } from "@/lib/apiConfig";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t("allFieldsRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${AUTH_API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data?.message || t("failedToSendResetLink"));
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(t("failedToConnectToServer"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-sky-50/60">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">{t("resetLinkSent")}</h2>
            <p className="text-gray-600 mb-6">
              {t("resetLinkSentDescription")}
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("backToLogin")}
            </Button>
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
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {t("forgotPasswordTitle")}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {t("forgotPasswordDescription")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("enterYourEmail")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isSubmitting || !email.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("sendingResetLink")}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {t("sendResetLink")}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("backToLogin")}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
