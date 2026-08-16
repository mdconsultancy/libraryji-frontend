"use client";

import { useState, FormEvent } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { normalizePlanFeatures } from "@/lib/planFeatures";
import type { SubscriptionPlan, BillingCycle, PlanFeature } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Subscription Plans" }];

const cycles: BillingCycle[] = ["monthly", "quarterly", "yearly"];
const cycleLabel = (cycle: string) =>
  cycle === "yearly" ? "1 year" : cycle === "quarterly" ? "3 months" : "1 month";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  original_price: "",
  billing_cycle: "monthly" as BillingCycle,
  badge_text: "",
  is_active: true,
  sort_order: "0",
  features: [] as PlanFeature[],
};

/** Live preview of exactly what this plan will look like on the public
 *  Plan & Pricing page (PlanPicker) — kept visually in sync with that
 *  component's card so admins aren't guessing at the result. */
function PlanCardPreview({ form }: { form: typeof emptyForm }) {
  const price = Number(form.price) || 0;
  const original = Number(form.original_price) || 0;
  const discountPct = original > price ? Math.round((1 - price / original) * 100) : null;

  return (
    <div className="relative flex flex-col rounded-2xl bg-white dark:bg-darkgray shadow-md overflow-hidden border border-border dark:border-darkborder w-full max-w-xs mx-auto">
      {form.badge_text && (
        <span className="absolute top-4 right-4 text-[11px] font-semibold uppercase tracking-wide bg-lightwarning text-warning px-2.5 py-1 rounded-full">
          {form.badge_text}
        </span>
      )}
      <div className="p-5 pb-4 border-b border-border dark:border-darkborder">
        <h5 className="text-base font-bold text-dark dark:text-white">{form.name || "Plan Name"}</h5>
        {form.description && <p className="text-xs text-darklink mt-1">{form.description}</p>}
        <div className="flex items-baseline gap-1.5 mt-3 flex-wrap">
          {original > price && (
            <span className="text-sm text-darklink line-through">₹{original.toLocaleString()}</span>
          )}
          <span className="text-2xl font-extrabold text-dark dark:text-white">₹{price.toLocaleString()}</span>
          <span className="text-xs text-darklink">/ {cycleLabel(form.billing_cycle)}</span>
        </div>
        {discountPct !== null && <p className="text-xs text-success font-semibold mt-1">{discountPct}% OFF</p>}
        {price === 0 && <p className="text-xs text-success font-medium mt-1">Free for {cycleLabel(form.billing_cycle)}</p>}
      </div>
      <div className="p-5">
        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-2 text-xs text-charcoal dark:text-white">
            <Icon icon="tabler:check" className="text-success shrink-0" width={15} height={15} />
            Unlimited seats, members &amp; staff
          </li>
          {form.features.filter((f) => f.text.trim() !== "").map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <Icon
                icon={feature.included ? "tabler:check" : "tabler:x"}
                className={`shrink-0 ${feature.included ? "text-success" : "text-error"}`}
                width={15}
                height={15}
              />
              <span className={feature.included ? "text-charcoal dark:text-white" : "text-darklink line-through"}>
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-md bg-lightprimary text-primary text-center text-xs font-semibold py-2">
          {price === 0 ? "Activate Free" : "Pay & Activate"}
        </div>
      </div>
    </div>
  );
}

export default function PlatformSubscriptionPlansPage() {
  const toast = useToast();
  const { data: plansData, isLoading: loading, error: loadError, mutate } = useApi<SubscriptionPlan[]>("/super-admin/subscription-plans");
  const plans = plansData ?? [];
  const error = loadError ? "Unable to load subscription plans." : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      price: String(plan.price),
      original_price: plan.original_price ? String(plan.original_price) : "",
      billing_cycle: plan.billing_cycle,
      badge_text: plan.badge_text || "",
      is_active: plan.is_active,
      sort_order: String(plan.sort_order),
      features: normalizePlanFeatures(plan.features),
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const addFeatureRow = () => setForm((f) => ({ ...f, features: [...f.features, { text: "", included: true }] }));
  const updateFeatureRow = (index: number, patch: Partial<PlanFeature>) =>
    setForm((f) => ({ ...f, features: f.features.map((feat, i) => (i === index ? { ...feat, ...patch } : feat)) }));
  const removeFeatureRow = (index: number) =>
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        billing_cycle: form.billing_cycle,
        badge_text: form.badge_text || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
        features: form.features.filter((f) => f.text.trim() !== ""),
      };
      if (editing) {
        await api.put(`/super-admin/subscription-plans/${editing.id}`, payload);
      } else {
        await api.post("/super-admin/subscription-plans", payload);
      }
      setDialogOpen(false);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete<{ message: string; deactivated?: boolean }>(`/super-admin/subscription-plans/${deleteTarget.id}`);
      if (res.deactivated) {
        toast.info(res.message);
      } else {
        toast.success(res.message);
      }
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete subscription plan. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <>
      <BreadcrumbComp title="Subscription Plans" items={BCrumb} />

      {/* Desktop (md and up): table */}
      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs hidden md:block">
        <div className="flex flex-wrap items-center justify-end gap-4 p-6">
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Add Plan
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={6} />
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">No subscription plans found</TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="ps-6 font-medium">{plan.name}</TableCell>
                    <TableCell>
                      {plan.original_price && Number(plan.original_price) > Number(plan.price) && (
                        <span className="text-darklink line-through mr-1.5">₹{Number(plan.original_price).toLocaleString()}</span>
                      )}
                      ₹{Number(plan.price).toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">{plan.billing_cycle}</TableCell>
                    <TableCell>Unlimited Seats, Members & Staff</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none ${plan.is_active ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="lightprimary" size="sm" onClick={() => openEdit(plan)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                        <Button
                          variant="lighterror"
                          size="sm"
                          onClick={() => setDeleteTarget(plan)}
                        >
                          <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardBox>

      {/* Mobile (below md): card list */}
      <div className="md:hidden flex flex-col gap-4">
        <Button onClick={openCreate} className="w-full flex items-center justify-center gap-1.5">
          <Icon icon="solar:add-circle-linear" width={18} height={18} />
          Add Plan
        </Button>

        {error && <p className="text-sm text-error">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500">No subscription plans found</p>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-dark dark:text-white truncate">{plan.name}</p>
                  <p className="text-xs text-darklink capitalize">{plan.billing_cycle}</p>
                </div>
                <Badge variant="secondary" className={`border-none shrink-0 ${plan.is_active ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                {plan.original_price && Number(plan.original_price) > Number(plan.price) && (
                  <span className="text-sm text-darklink line-through">₹{Number(plan.original_price).toLocaleString()}</span>
                )}
                <span className="text-lg font-bold text-dark dark:text-white">₹{Number(plan.price).toLocaleString()}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="lightprimary" size="sm" className="flex-1" onClick={() => openEdit(plan)}>
                  <Icon icon="ic:outline-edit" width={16} height={16} className="mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="lighterror"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeleteTarget(plan)}
                >
                  <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} className="mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "Add Plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <form id="plan-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="price">Price (₹) — use 0 for a free plan</Label>
                <Input id="price" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                {fieldError("price") && <p className="text-xs text-error">{fieldError("price")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="original_price">Original Price (₹, optional)</Label>
                <Input id="original_price" type="number" min={0} step="0.01" placeholder="e.g. 999 (shown struck-through)" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
                {fieldError("original_price") && <p className="text-xs text-error">{fieldError("original_price")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Billing Cycle</Label>
                <Select value={form.billing_cycle} onValueChange={(v) => setForm({ ...form, billing_cycle: v as BillingCycle })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="badge_text">Badge Text (optional)</Label>
                <Input id="badge_text" placeholder="e.g. BEST VALUE" value={form.badge_text} onChange={(e) => setForm({ ...form, badge_text: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input id="sort_order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v === true })} />
                <Label htmlFor="is_active" className="font-normal">Active</Label>
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>Plan Features</Label>
                <p className="text-xs text-darklink -mt-1">
                  Shown on the Plan &amp; Pricing page. Click the ✓/✕ to mark a feature included or unavailable on this plan.
                </p>
                <div className="flex flex-col gap-2">
                  {form.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateFeatureRow(index, { included: !feature.included })}
                        aria-label={feature.included ? "Included — click to mark unavailable" : "Unavailable — click to mark included"}
                        className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-white transition-colors ${
                          feature.included ? "bg-success" : "bg-error"
                        }`}
                      >
                        <Icon icon={feature.included ? "tabler:check" : "tabler:x"} width={18} height={18} />
                      </button>
                      <Input
                        value={feature.text}
                        onChange={(e) => updateFeatureRow(index, { text: e.target.value })}
                        placeholder="e.g. Priority support"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="lighterror"
                        size="sm"
                        className="shrink-0"
                        onClick={() => removeFeatureRow(index)}
                        aria-label="Remove feature"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="w-fit flex items-center gap-1.5" onClick={addFeatureRow}>
                  <Icon icon="solar:add-circle-linear" width={16} height={16} />
                  Add Feature
                </Button>
              </div>
            </form>

            {/* Live preview — sticky on desktop so it stays visible while the form scrolls */}
            <div className="lg:sticky lg:top-0 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-wide text-darklink mb-2">Preview</p>
              <PlanCardPreview form={form} />
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-4">
            <Button type="submit" form="plan-form" className="rounded-md" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove the subscription plan."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
