"use client";

import { useEffect, useState, FormEvent } from "react";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@iconify/react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import PasswordInput from "@/components/form/PasswordInput";
import ColorPickerField from "@/components/form/ColorPickerField";
import CurrencySelect from "@/components/form/CurrencySelect";
import LanguageSelect from "@/components/form/LanguageSelect";
import FontFamilySelect from "@/components/form/FontFamilySelect";
import ImageUploadField from "@/components/form/ImageUploadField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencies } from "@/data/currencies";
import { storageUrl } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { FormSkeleton } from "@/components/shared/skeletons";

const BCrumb = [{ to: "/dashboard", title: "Home" }, { title: "Platform Settings" }];

type FieldType = "text" | "number" | "password" | "boolean" | "textarea" | "color" | "currency" | "language" | "font" | "select";

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
}

const GROUPS: { key: string; label: string; description?: string; fields: FieldConfig[] }[] = [
  {
    key: "general",
    label: "General",
    fields: [
      { key: "site_name", label: "Site Name", type: "text" },
      { key: "timezone", label: "Timezone", type: "text" },
      {
        key: "date_format", label: "Date Format", type: "select",
        options: [
          { value: "Y-m-d", label: "2026-08-07 (Y-m-d)" },
          { value: "d/m/Y", label: "07/08/2026 (d/m/Y)" },
          { value: "m/d/Y", label: "08/07/2026 (m/d/Y)" },
          { value: "d-M-Y", label: "07-Aug-2026 (d-M-Y)" },
        ],
      },
      {
        key: "time_format", label: "Time Format", type: "select",
        options: [
          { value: "12", label: "12-hour (2:30 PM)" },
          { value: "24", label: "24-hour (14:30)" },
        ],
      },
      { key: "language", label: "Language", type: "language" },
      { key: "max_upload_size_mb", label: "Max Upload Size (MB)", type: "number" },
      { key: "allowed_file_types", label: "Allowed File Types", type: "text" },
      { key: "system_notifications_enabled", label: "System Notifications Enabled", type: "boolean" },
      { key: "support_email", label: "Support Email", type: "text" },
      { key: "support_phone", label: "Support Phone", type: "text" },
    ],
  },
  {
    key: "payment",
    label: "Payment",
    fields: [
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "currency", label: "Currency", type: "currency" },
      { key: "currency_symbol", label: "Currency Symbol", type: "text" },
      { key: "tax_percentage", label: "Tax Percentage", type: "number" },
      { key: "tax_label", label: "Tax Label", type: "text" },
      { key: "invoice_prefix", label: "Invoice Prefix", type: "text" },
      {
        key: "billing_cycle_default", label: "Default Billing Cycle", type: "select",
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "yearly", label: "Yearly" },
        ],
      },
      { key: "razorpay_enabled", label: "Razorpay Enabled", type: "boolean" },
      { key: "razorpay_key_id", label: "Razorpay Key ID", type: "text" },
      { key: "razorpay_key_secret", label: "Razorpay Key Secret", type: "password" },
      { key: "razorpay_webhook_secret", label: "Razorpay Webhook Secret", type: "password" },
      { key: "cashfree_enabled", label: "Cashfree Enabled", type: "boolean" },
      {
        key: "cashfree_mode", label: "Cashfree Mode", type: "select",
        options: [
          { value: "test", label: "Test / Sandbox" },
          { value: "production", label: "Production (Live)" },
        ],
      },
      { key: "cashfree_app_id", label: "Cashfree App ID", type: "text" },
      { key: "cashfree_secret_key", label: "Cashfree Secret Key", type: "password" },
      { key: "cashfree_webhook_secret", label: "Cashfree Webhook Secret", type: "password" },
      { key: "stripe_enabled", label: "Stripe Enabled", type: "boolean" },
      { key: "stripe_publishable_key", label: "Stripe Publishable Key", type: "text" },
      { key: "stripe_secret_key", label: "Stripe Secret Key", type: "password" },
    ],
  },
  {
    key: "smtp",
    label: "SMTP",
    fields: [
      { key: "mail_host", label: "Mail Host", type: "text" },
      { key: "mail_port", label: "Mail Port", type: "number" },
      {
        key: "mail_encryption", label: "Encryption", type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "tls", label: "TLS" },
          { value: "ssl", label: "SSL" },
        ],
      },
      { key: "mail_username", label: "Username", type: "text" },
      { key: "mail_password", label: "Password", type: "password" },
      { key: "mail_from_address", label: "From Address", type: "text" },
      { key: "mail_from_name", label: "From Name", type: "text" },
    ],
  },
  {
    key: "security",
    label: "Security",
    fields: [
      { key: "password_min_length", label: "Password Min Length", type: "number" },
      { key: "password_require_uppercase", label: "Require Uppercase", type: "boolean" },
      { key: "password_require_number", label: "Require Number", type: "boolean" },
      { key: "password_require_symbol", label: "Require Symbol", type: "boolean" },
      { key: "two_factor_required", label: "Two-Factor Required", type: "boolean" },
      { key: "session_timeout_minutes", label: "Session Timeout (minutes)", type: "number" },
      { key: "max_login_attempts", label: "Max Login Attempts", type: "number" },
      { key: "lockout_minutes", label: "Lockout (minutes)", type: "number" },
      { key: "api_rate_limit_per_minute", label: "API Rate Limit / Minute", type: "number" },
      { key: "ip_whitelist", label: "IP Whitelist", type: "textarea" },
      { key: "ip_blacklist", label: "IP Blacklist", type: "textarea" },
    ],
  },
  {
    key: "theme",
    label: "Theme",
    fields: [
      {
        key: "mode", label: "Mode", type: "select",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ],
      },
      { key: "primary_color", label: "Primary Color", type: "color" },
      { key: "secondary_color", label: "Secondary Color", type: "color" },
      { key: "accent_color", label: "Accent Color", type: "color" },
      { key: "font_family", label: "Font Family", type: "font" },
      { key: "custom_css", label: "Custom CSS", type: "textarea" },
    ],
  },
  {
    key: "admin_ui",
    label: "Admin UI",
    fields: [
      { key: "sidebar_color", label: "Sidebar Color", type: "color" },
      { key: "navbar_color", label: "Navbar Color", type: "color" },
      {
        key: "dashboard_theme", label: "Dashboard Theme", type: "select",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ],
      },
      {
        key: "button_style", label: "Button Style", type: "select",
        options: [
          { value: "rounded", label: "Rounded" },
          { value: "square", label: "Square" },
          { value: "pill", label: "Pill" },
        ],
      },
      {
        key: "layout", label: "Layout", type: "select",
        options: [
          { value: "vertical", label: "Vertical" },
          { value: "horizontal", label: "Horizontal" },
          { value: "boxed", label: "Boxed" },
        ],
      },
      {
        key: "border_radius", label: "Border Radius", type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "full", label: "Full" },
        ],
      },
      { key: "compact_mode", label: "Compact Mode", type: "boolean" },
    ],
  },
  {
    key: "oauth",
    label: "OAuth Settings",
    fields: [
      { key: "google_login_enabled", label: "Google Login Enabled", type: "boolean" },
      { key: "google_client_id", label: "Google Client ID", type: "text" },
      { key: "google_client_secret", label: "Google Client Secret", type: "password" },
      { key: "google_redirect_uri", label: "Google Redirect URI", type: "text" },
    ],
  },
  {
    key: "notifications",
    label: "Notifications",
    fields: [
      { key: "push_notifications_enabled", label: "Push Notifications Enabled", type: "boolean" },
    ],
  },
  {
    key: "meta",
    label: "Meta",
    description:
      "Meta (Facebook) Pixel tracks page views across the site so you can measure and retarget ads. Find your Pixel ID in Meta Events Manager → Data Sources. It's loaded on every page once enabled and saved.",
    fields: [
      { key: "meta_pixel_enabled", label: "Meta Pixel Enabled", type: "boolean" },
      { key: "meta_pixel_id", label: "Meta Pixel ID", type: "text" },
    ],
  },
];

type SettingsValue = Record<string, unknown>;
type AllSettings = Record<string, SettingsValue>;

export default function PlatformSettingsPage() {
  const toast = useToast();
  const [allSettings, setAllSettings] = useState<AllSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedGroup, setSavedGroup] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [testAmount, setTestAmount] = useState("1");
  const [testRazorpayStatus, setTestRazorpayStatus] = useState<string | null>(null);
  const [testingRazorpay, setTestingRazorpay] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<"logo" | "favicon" | null>(null);
  const [testGoogleStatus, setTestGoogleStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testingGoogle, setTestingGoogle] = useState(false);

  const loadSettings = () => {
    setLoading(true);
    setLoadError(null);
    api
      .get<AllSettings>("/super-admin/settings")
      .then(setAllSettings)
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : "Unable to load settings. Please refresh the page.");
        toast.error("Unable to load settings from the server.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAssetUpload = async (type: "logo" | "favicon", file: File | null) => {
    if (!file) return;
    setUploadingAsset(type);
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("file", file);
      const res = await api.post<{ key: string; path: string; url?: string }>("/super-admin/settings/theme/upload", fd);
      updateField("theme", res.key, res.path);
      toast.success(`${type === "logo" ? "Logo" : "Favicon"} uploaded.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : `Unable to upload ${type}.`);
    } finally {
      setUploadingAsset(null);
    }
  };

  // Only one payment gateway can be primary — turning one on flips the
  // others off in the form immediately (the server enforces this too).
  const GATEWAY_TOGGLES = ["razorpay_enabled", "cashfree_enabled", "stripe_enabled"];

  const updateField = (group: string, key: string, value: unknown) => {
    setAllSettings((prev) => {
      const next = { ...prev[group], [key]: value };
      if (group === "payment" && GATEWAY_TOGGLES.includes(key) && (value === true || value === "1")) {
        for (const other of GATEWAY_TOGGLES) if (other !== key) next[other] = false;
      }
      return { ...prev, [group]: next };
    });
  };

  const saveGroup = async (group: string, settings: SettingsValue) => {
    const data = await api.put<{ group: string; settings: SettingsValue }>(`/super-admin/settings/${group}`, {
      settings,
    });
    setAllSettings((prev) => ({ ...prev, [group]: data.settings }));
    return data.settings;
  };

  const handleSave = async (e: FormEvent, group: string) => {
    e.preventDefault();
    setSaving(true);
    setSavedGroup(null);
    try {
      await saveGroup(group, allSettings[group] || {});
      setSavedGroup(group);
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggles like "Google Login Enabled" gate a live feature — leaving the
   * new value sitting unsaved in form state until someone remembers to
   * scroll down and hit the group's Save button (easy to miss, especially
   * on a small screen) means the toggle *looks* off but the backend, and
   * therefore every other client reading it, still sees the old value. Save
   * on change instead, so what the switch shows is always what's live.
   */
  const handleInstantToggle = async (group: string, key: string, value: boolean) => {
    const previous = allSettings[group]?.[key];
    updateField(group, key, value);
    try {
      await saveGroup(group, { ...(allSettings[group] || {}), [key]: value });
      toast.success("Settings saved.");
    } catch (err) {
      updateField(group, key, previous);
      toast.error(err instanceof ApiError ? err.message : "Unable to save settings.");
    }
  };

  const handleTestRazorpay = async () => {
    setTestRazorpayStatus(null);
    setTestingRazorpay(true);
    try {
      const order = await api.post<{
        key_id: string;
        is_live: boolean;
        order_id: string;
        amount: number;
        currency: string;
        company_name: string;
      }>("/super-admin/settings/payment/test-razorpay", { amount: Number(testAmount) });

      if (order.is_live) {
        const proceed = window.confirm(
          "These are LIVE Razorpay keys — this test will attempt a REAL payment and REAL money can be charged. Continue?"
        );
        if (!proceed) {
          setTestingRazorpay(false);
          return;
        }
      }

      await openRazorpayCheckout(
        {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          order_id: order.order_id,
          name: order.company_name,
          description: "Platform settings — Razorpay connection test",
          theme: { color: "#6366f1" },
          handler: (response) => {
            setTestRazorpayStatus(`Payment successful — Payment ID: ${response.razorpay_payment_id}`);
            toast.success("Razorpay is connected and working — test payment completed.");
          },
          modal: {
            ondismiss: () => setTestRazorpayStatus("Test popup closed before completing payment."),
          },
        },
        (message) => {
          setTestRazorpayStatus(message);
          toast.error(message);
        }
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to test Razorpay connection.";
      setTestRazorpayStatus(message);
      toast.error(message);
    } finally {
      setTestingRazorpay(false);
    }
  };

  const handleTestGoogleLogin = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setTestGoogleStatus({ ok: false, message: "Google did not return a credential. Please try again." });
      return;
    }
    setTestingGoogle(true);
    setTestGoogleStatus(null);
    try {
      const res = await api.post<{ success: boolean; email: string; name: string; message?: string }>(
        "/super-admin/settings/oauth/test-google",
        {
          id_token: credentialResponse.credential,
          client_id: allSettings.oauth?.google_client_id,
          client_secret: allSettings.oauth?.google_client_secret,
          redirect_uri: allSettings.oauth?.google_redirect_uri,
        }
      );
      setTestGoogleStatus({ ok: true, message: `Verified successfully as ${res.name} (${res.email}).` });
      toast.success("Google sign-in test passed.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Google sign-in test failed.";
      setTestGoogleStatus({ ok: false, message });
      toast.error(message);
    } finally {
      setTestingGoogle(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailStatus(null);
    try {
      const res = await api.post<{ message: string }>("/super-admin/settings/smtp/test-email", { email: testEmail });
      setTestEmailStatus(res.message);
      toast.success(res.message);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to send test email.";
      setTestEmailStatus(message);
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <>
        <BreadcrumbComp title="Platform Settings" items={BCrumb} />
        <FormSkeleton tabs={6} fields={8} />
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <BreadcrumbComp title="Platform Settings" items={BCrumb} />
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs text-center">
          <p className="text-sm text-error mb-4">{loadError}</p>
          <Button variant="outline" onClick={loadSettings}>
            Retry
          </Button>
        </CardBox>
      </>
    );
  }

  return (
    <>
      <BreadcrumbComp title="Platform Settings" items={BCrumb} />

      <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
        <Tabs defaultValue="general">
          <TabsList className="flex-wrap h-auto">
            {GROUPS.map((g) => (
              <TabsTrigger key={g.key} value={g.key}>{g.label}</TabsTrigger>
            ))}
          </TabsList>

          {GROUPS.map((group) => (
            <TabsContent key={group.key} value={group.key}>
              <form onSubmit={(e) => handleSave(e, group.key)} className="grid grid-cols-1 gap-4 lg:grid-cols-2 mt-4">
                {group.description && <p className="text-sm text-darklink lg:col-span-2">{group.description}</p>}
                {savedGroup === group.key && <p className="text-sm text-success lg:col-span-2">Settings saved.</p>}
                {group.fields.map((field) => {
                  const value = allSettings[group.key]?.[field.key];

                  if (field.type === "boolean") {
                    const isInstant =
                      (group.key === "oauth" && field.key === "google_login_enabled") ||
                      (group.key === "notifications" && field.key === "push_notifications_enabled");
                    return (
                      <div key={field.key} className="flex items-center gap-2">
                        <Switch
                          id={`${group.key}_${field.key}`}
                          checked={value === true || value === "true" || value === "1" || value === 1}
                          onCheckedChange={(v) =>
                            isInstant ? handleInstantToggle(group.key, field.key, v) : updateField(group.key, field.key, v)
                          }
                        />
                        <Label htmlFor={`${group.key}_${field.key}`} className="font-normal">
                          {field.label}
                          {isInstant && <span className="text-xs text-gray-500 font-normal"> (saves instantly)</span>}
                        </Label>
                      </div>
                    );
                  }

                  if (field.type === "textarea") {
                    return (
                      <div key={field.key} className="flex flex-col gap-2 lg:col-span-2">
                        <Label htmlFor={`${group.key}_${field.key}`}>{field.label}</Label>
                        <Textarea
                          id={`${group.key}_${field.key}`}
                          value={(value as string) ?? ""}
                          onChange={(e) => updateField(group.key, field.key, e.target.value)}
                        />
                      </div>
                    );
                  }

                  if (field.type === "color") {
                    return (
                      <div key={field.key} className="flex flex-col gap-2">
                        <Label htmlFor={`${group.key}_${field.key}`}>{field.label}</Label>
                        <ColorPickerField
                          id={`${group.key}_${field.key}`}
                          value={(value as string) ?? ""}
                          onChange={(v) => updateField(group.key, field.key, v)}
                        />
                      </div>
                    );
                  }

                  if (field.type === "currency") {
                    return (
                      <div key={field.key} className="flex flex-col gap-2">
                        <Label htmlFor={`${group.key}_${field.key}`}>{field.label}</Label>
                        <CurrencySelect
                          id={`${group.key}_${field.key}`}
                          value={(value as string) ?? ""}
                          onChange={(code, currency) => {
                            updateField(group.key, field.key, code);
                            if (!allSettings[group.key]?.currency_symbol) {
                              updateField(group.key, "currency_symbol", currency.symbol);
                            }
                          }}
                        />
                      </div>
                    );
                  }

                  if (field.type === "language") {
                    return (
                      <div key={field.key} className="flex flex-col gap-2">
                        <Label htmlFor={`${group.key}_${field.key}`}>{field.label}</Label>
                        <LanguageSelect
                          id={`${group.key}_${field.key}`}
                          value={(value as string) ?? ""}
                          onChange={(v) => updateField(group.key, field.key, v)}
                        />
                      </div>
                    );
                  }

                  if (field.type === "font") {
                    return (
                      <div key={field.key} className="flex flex-col gap-2">
                        <Label htmlFor={`${group.key}_${field.key}`}>{field.label}</Label>
                        <FontFamilySelect
                          id={`${group.key}_${field.key}`}
                          value={(value as string) ?? ""}
                          onChange={(v) => updateField(group.key, field.key, v)}
                        />
                      </div>
                    );
                  }

                  if (field.type === "select") {
                    return (
                      <div key={field.key} className="flex flex-col gap-2">
                        <Label htmlFor={`${group.key}_${field.key}`}>{field.label}</Label>
                        <Select
                          value={(value as string) || undefined}
                          onValueChange={(v) => updateField(group.key, field.key, v)}
                        >
                          <SelectTrigger id={`${group.key}_${field.key}`}>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  if (field.type === "password") {
                    return (
                      <div key={field.key} className="flex flex-col gap-2">
                        <Label htmlFor={`${group.key}_${field.key}`}>{field.label}</Label>
                        <PasswordInput
                          id={`${group.key}_${field.key}`}
                          value={(value as string) ?? ""}
                          onChange={(v) => updateField(group.key, field.key, v)}
                          placeholder="Enter value"
                          autoComplete="off"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <Label htmlFor={`${group.key}_${field.key}`}>{field.label}</Label>
                      <Input
                        id={`${group.key}_${field.key}`}
                        type={field.type === "number" ? "number" : "text"}
                        value={(value as string) ?? ""}
                        onChange={(e) => updateField(group.key, field.key, e.target.value)}
                      />
                    </div>
                  );
                })}

                {group.key === "smtp" && (
                  <div className="flex flex-col gap-2 lg:col-span-2 border-t border-border pt-4 mt-2">
                    <Label htmlFor="test_email">Send Test Email</Label>
                    <div className="flex gap-2">
                      <Input id="test_email" type="email" placeholder="you@example.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                      <Button type="button" variant="outline" onClick={handleTestEmail} disabled={!testEmail}>
                        Send Test
                      </Button>
                    </div>
                    {testEmailStatus && <p className="text-sm text-darklink">{testEmailStatus}</p>}
                  </div>
                )}

                {group.key === "payment" && (
                  <div className="flex flex-col gap-2 lg:col-span-2 border-t border-border pt-4 mt-2">
                    <Label htmlFor="test_razorpay_amount">Test Razorpay Connection</Label>
                    <div className="flex gap-2">
                      <Input
                        id="test_razorpay_amount"
                        type="number"
                        min={1}
                        step="0.01"
                        placeholder="Amount"
                        value={testAmount}
                        onChange={(e) => setTestAmount(e.target.value)}
                        className="max-w-40"
                      />
                      <Button type="button" variant="outline" onClick={handleTestRazorpay} disabled={!testAmount || testingRazorpay}>
                        {testingRazorpay ? "Testing..." : "Send Test"}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Opens the actual Razorpay payment popup for this amount so you can see it work end-to-end. With
                      test keys (rzp_test_...) no real money moves; with live keys this is a real charge.
                    </p>
                    {testRazorpayStatus && <p className="text-sm text-darklink">{testRazorpayStatus}</p>}
                  </div>
                )}

                {group.key === "payment" && (
                  <p className="text-xs text-gray-500 lg:col-span-2">
                    {currencies.find((c) => c.code === allSettings.payment?.currency)?.name}
                  </p>
                )}

                {group.key === "oauth" && (
                  <div className="flex flex-col gap-2 lg:col-span-2 border-t border-border pt-4 mt-2">
                    <Label>Authorized Redirect URI</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={(allSettings.oauth?.google_redirect_uri as string) || ""}
                        placeholder="Set the Google Redirect URI above, then copy it into Google Cloud Console"
                        className="bg-muted"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!allSettings.oauth?.google_redirect_uri}
                        onClick={async () => {
                          const uri = (allSettings.oauth?.google_redirect_uri as string) || "";
                          try {
                            await navigator.clipboard.writeText(uri);
                            toast.success("Redirect URI copied.");
                          } catch {
                            toast.error("Unable to copy to clipboard.");
                          }
                        }}
                      >
                        <Icon icon="tabler:copy" width={18} height={18} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Register this exact URI as an authorized redirect URI for your OAuth client in the Google Cloud
                      Console. The Client Secret is stored securely and only ever shown masked.
                    </p>
                  </div>
                )}

                {group.key === "oauth" && (
                  <div className="flex flex-col gap-2 lg:col-span-2 border-t border-border pt-4 mt-2">
                    <Label>Test Google Login</Label>
                    <p className="text-xs text-gray-500">
                      Uses whatever Client ID is currently typed above (saved or not) to run a real sign-in and
                      verify it works — pick a Google account and this confirms the credentials before you flip
                      &quot;Google Login Enabled&quot; on for everyone.
                    </p>
                    {allSettings.oauth?.google_client_id ? (
                      <div className={testingGoogle ? "opacity-60 pointer-events-none w-fit" : "w-fit"}>
                        <GoogleOAuthProvider clientId={allSettings.oauth.google_client_id as string}>
                          <GoogleLogin
                            onSuccess={handleTestGoogleLogin}
                            onError={() => setTestGoogleStatus({ ok: false, message: "Google sign-in failed. Please try again." })}
                            width="280"
                          />
                        </GoogleOAuthProvider>
                      </div>
                    ) : (
                      <p className="text-sm text-darklink">Enter a Google Client ID above first.</p>
                    )}
                    {testGoogleStatus && (
                      <p className={`text-sm ${testGoogleStatus.ok ? "text-success" : "text-error"}`}>
                        {testGoogleStatus.message}
                      </p>
                    )}
                  </div>
                )}

                {group.key === "notifications" && (
                  <div className="flex flex-col gap-2 lg:col-span-2 border-t border-border pt-4 mt-2">
                    <p className="text-xs text-gray-500">
                      Push notifications are delivered via Expo&apos;s push service — there are no Firebase/Apple
                      credentials to enter here. The mobile app registers itself automatically once a user grants
                      the notification permission. Use the &quot;Test Notification&quot; button in the mobile app&apos;s
                      Super Admin settings to verify delivery.
                    </p>
                  </div>
                )}

                {group.key === "theme" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 border-t border-border pt-4 mt-2">
                    <div className="flex flex-col gap-2">
                      <Label>Logo</Label>
                      <ImageUploadField
                        value={null}
                        onChange={(file) => handleAssetUpload("logo", file)}
                        existingUrl={storageUrl(allSettings.theme?.logo_path as string | undefined)}
                      />
                      {uploadingAsset === "logo" && <p className="text-xs text-primary">Uploading...</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Favicon</Label>
                      <ImageUploadField
                        value={null}
                        onChange={(file) => handleAssetUpload("favicon", file)}
                        existingUrl={storageUrl(allSettings.theme?.favicon_path as string | undefined)}
                        maxSizeMb={1}
                      />
                      {uploadingAsset === "favicon" && <p className="text-xs text-primary">Uploading...</p>}
                    </div>
                    <p className="text-xs text-gray-500 sm:col-span-2">
                      Logo and favicon upload and save immediately — no need to click Save for these.
                    </p>
                  </div>
                )}

                <div className="lg:col-span-2 flex justify-end">
                  <Button type="submit" className="flex items-center gap-1.5" disabled={saving}>
                    <Icon icon="tabler:device-floppy" width={18} height={18} />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          ))}
        </Tabs>
      </CardBox>
    </>
  );
}
