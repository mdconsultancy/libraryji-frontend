"use client";
import Image from "next/image"
import CardBox from "../shared/CardBox"
import { Icon } from "@iconify/react/dist/iconify.js"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { useState } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/form/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/types";

const UserProfile = () => {
    const { user, refreshMe } = useAuth();
    const [openModal, setOpenModal] = useState(false);
    const [modalType, setModalType] = useState<"personal" | "password" | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savingTwoFactor, setSavingTwoFactor] = useState(false);

    const toggleTwoFactor = async () => {
        if (!user) return;
        setSavingTwoFactor(true);
        try {
            await api.put<{ user: User }>("/auth/profile", { two_factor_enabled: !user.two_factor_enabled });
            await refreshMe();
        } catch {
            // Best-effort — the toggle just won't visually flip since refreshMe() re-reads the unchanged value.
        } finally {
            setSavingTwoFactor(false);
        }
    };

    const BCrumb = [
        {
            to: "/",
            title: "Home",
        },
        {
            title: "Userprofile",
        },
    ];

    const [personalForm, setPersonalForm] = useState({ name: "", phone: "" });
    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const openPersonalModal = () => {
        setPersonalForm({ name: user?.name || "", phone: user?.phone || "" });
        setModalType("personal");
        setError(null);
        setOpenModal(true);
    };

    const openPasswordModal = () => {
        setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
        setModalType("password");
        setError(null);
        setOpenModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            if (modalType === "personal") {
                await api.put<{ user: User }>("/auth/profile", personalForm);
            } else if (modalType === "password") {
                await api.put<{ user: User }>("/auth/profile", passwordForm);
            }
            await refreshMe();
            setOpenModal(false);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Unable to save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <>
            <BreadcrumbComp title="User Profile" items={BCrumb} />
            <div className="flex flex-col gap-6">
                <CardBox className="p-6 bg-background overflow-hidden border-none rounded-xl shadow-xs">
                    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl relative w-full words-break">
                        <div>
                            <Image src={"/images/profile/user-1.jpg"} alt="image" width={80} height={80} className="rounded-full" />
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center sm:justify-between items-center w-full">
                            <div className="flex flex-col sm:text-left text-center gap-1.5">
                                <h5 className="card-title">{user.name}</h5>
                                <div className="flex flex-wrap items-center gap-1 md:gap-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
                                    {user.current_tenant?.name && (
                                        <>
                                            <div className="hidden h-4 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.current_tenant.name}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardBox>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-6 rounded-xl shadow-xs bg-background md:p-6 p-4 relative w-full words-break">
                        <h5 className="card-title">Personal Information</h5>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                            <div><p className="text-xs text-gray-500">Name</p><p>{user.name}</p></div>
                            <div><p className="text-xs text-gray-500">Email</p><p>{user.email}</p></div>
                            <div><p className="text-xs text-gray-500">Phone</p><p>{user.phone || '—'}</p></div>
                            <div><p className="text-xs text-gray-500">Role</p><p className="capitalize">{user.role.replace('_', ' ')}</p></div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={openPersonalModal} color={"primary"} className="flex items-center gap-1.5 rounded-md">
                                <Icon icon="ic:outline-edit" width="18" height="18" /> Edit
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-xl shadow-xs bg-background md:p-6 p-4 relative w-full words-break">
                        <h5 className="card-title">Security</h5>
                        <div className="grid grid-cols-1 gap-4">
                            <div><p className="text-xs text-gray-500">Password</p><p>••••••••</p></div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={openPasswordModal} color={"primary"} className="flex items-center gap-1.5 rounded-md">
                                <Icon icon="ic:outline-edit" width="18" height="18" /> Change Password
                            </Button>
                        </div>

                        {user.role === "super_admin" && (
                            <div className="flex items-center justify-between rounded-lg border border-border dark:border-darkborder p-4 mt-2">
                                <div>
                                    <p className="font-medium text-sm">Two-factor authentication</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Require a 6-digit code emailed to you every time you sign in.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleTwoFactor}
                                    disabled={savingTwoFactor}
                                    aria-pressed={user.two_factor_enabled}
                                    className={`shrink-0 h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
                                        user.two_factor_enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                                    }`}
                                >
                                    <span
                                        className={`block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                                            user.two_factor_enabled ? "translate-x-5" : "translate-x-0.5"
                                        }`}
                                    />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="mb-4">
                            {modalType === "personal" ? "Edit Personal Information" : "Change Password"}
                        </DialogTitle>
                    </DialogHeader>

                    {error && (
                        <div className="mb-2 rounded-md bg-lighterror px-3 py-2 text-sm text-error">{error}</div>
                    )}

                    {modalType === "personal" ? (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Name"
                                    value={personalForm.name}
                                    onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    placeholder="Phone"
                                    value={personalForm.phone}
                                    onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="current_password">Current Password</Label>
                                <PasswordInput
                                    id="current_password"
                                    value={passwordForm.current_password}
                                    onChange={(v) => setPasswordForm({ ...passwordForm, current_password: v })}
                                    autoComplete="current-password"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="new_password">New Password</Label>
                                <PasswordInput
                                    id="new_password"
                                    value={passwordForm.password}
                                    onChange={(v) => setPasswordForm({ ...passwordForm, password: v })}
                                    autoComplete="new-password"
                                    showStrength
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    value={passwordForm.password_confirmation}
                                    onChange={(v) => setPasswordForm({ ...passwordForm, password_confirmation: v })}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2 mt-4">
                        <Button color={"primary"} className="rounded-md" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button color={"lighterror"} className="rounded-md bg-lighterror dark:bg-darkerror text-error hover:bg-error hover:text-white" onClick={() => setOpenModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UserProfile;
