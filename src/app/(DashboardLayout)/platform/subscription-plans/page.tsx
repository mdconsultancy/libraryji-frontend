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

const emptyForm = {
  name: "",
  description: "",
  price: "",
  billing_cycle: "monthly" as BillingCycle,
  is_active: true,
  sort_order: "0",
  features: [] as PlanFeature[],
};

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
      billing_cycle: plan.billing_cycle,
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
        billing_cycle: form.billing_cycle,
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

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
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
                    <TableCell>₹{Number(plan.price).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{plan.billing_cycle}</TableCell>
                    <TableCell>Unlimited Seats, Members & Staff</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none ${plan.is_active ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error hover:bg-error hover:text-white"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "Add Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2 lg:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              {fieldError("price") && <p className="text-xs text-error">{fieldError("price")}</p>}
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
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input id="sort_order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is_active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v === true })} />
              <Label htmlFor="is_active" className="font-normal">Active</Label>
            </div>

            <div className="flex flex-col gap-2 lg:col-span-2">
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
                      variant="outline"
                      size="sm"
                      className="text-error hover:bg-error hover:text-white shrink-0"
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

            <DialogFooter className="lg:col-span-2 flex gap-2 mt-4">
              <Button type="submit" className="rounded-md" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
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
