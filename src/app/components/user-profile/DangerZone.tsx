"use client";

import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

type CleanStep = "confirm-type" | "otp" | "done";

/**
 * "Danger Zone" — irreversible, admin-only data cleaning:
 *  - Clean All Library Data: wipes this library's operational records
 *    (students, staff, payments, seats, attendance, leads, expenses) after
 *    a typed "DELETE" confirmation + an emailed OTP.
 *  - After completion, automatically logs out the admin to ensure a clean session.
 */
export default function DangerZone() {
    const toast = useToast();
    const { logout } = useAuth();

    // Clean All Library Data
    const [cleanModalOpen, setCleanModalOpen] = useState(false);
    const [cleanStep, setCleanStep] = useState<CleanStep>("confirm-type");
    const [typedConfirmation, setTypedConfirmation] = useState("");
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState<string | null>(null);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [deletedSummary, setDeletedSummary] = useState<Record<string, number> | null>(null);

    const openCleanModal = () => {
        setCleanStep("confirm-type");
        setTypedConfirmation("");
        setOtp("");
        setOtpError(null);
        setDeletedSummary(null);
        setCleanModalOpen(true);
    };

    const requestOtp = async () => {
        setSendingOtp(true);
        setOtpError(null);
        try {
            await api.post("/admin/danger-zone/clean-data/request-otp");
            setCleanStep("otp");
            toast.info("A 6-digit verification code has been sent to your email.");
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Unable to send a verification code.");
        } finally {
            setSendingOtp(false);
        }
    };

    const confirmClean = async () => {
        setConfirming(true);
        setOtpError(null);
        try {
            const data = await api.post<{ message: string; deleted: Record<string, number> }>(
                "/admin/danger-zone/clean-data/confirm",
                { code: otp }
            );
            setDeletedSummary(data.deleted);
            setCleanStep("done");
        } catch (err) {
            setOtpError(err instanceof ApiError ? err.message : "Unable to verify code. Please try again.");
        } finally {
            setConfirming(false);
        }
    };

    const handleDoneLogout = async () => {
        setCleanModalOpen(false);
        await logout();
    };

    return (
        <>
            <div className="rounded-xl border border-error/30 bg-lighterror dark:bg-darkerror/20 md:p-6 p-4 relative w-full words-break">
                <div className="flex items-center gap-2 mb-1">
                    <Icon icon="tabler:alert-triangle-filled" className="text-error" width={20} height={20} />
                    <h5 className="card-title text-error">Danger Zone</h5>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                    These actions are irreversible. Please proceed with caution.
                </p>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/40 bg-background p-4">
                        <div>
                            <p className="font-medium text-sm text-error flex items-center gap-1.5">
                                <Icon icon="tabler:trash-x" width={16} height={16} />
                                Clean All Library Data
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
                                Permanently erase all students, staff accounts, payments, seats, attendance records, leads, and
                                expenses for this library. Your login account, subscription plan, and billing history are preserved.
                            </p>
                        </div>
                        <Button
                            className="shrink-0 bg-error hover:bg-error/90 text-white"
                            onClick={openCleanModal}
                        >
                            Clean Data
                        </Button>
                    </div>
                </div>
            </div>

            {/* Clean All Library Data modal */}
            <Dialog open={cleanModalOpen} onOpenChange={(open) => {
                if (cleanStep === "done") {
                    handleDoneLogout();
                } else {
                    setCleanModalOpen(open);
                }
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-error flex items-center gap-2">
                            <Icon icon="tabler:alert-triangle" width={20} height={20} />
                            Clean All Library Data
                        </DialogTitle>
                    </DialogHeader>

                    {cleanStep === "confirm-type" && (
                        <div className="grid grid-cols-1 gap-4">
                            <div className="rounded-md bg-lighterror px-3 py-2.5 text-sm text-error leading-relaxed">
                                This will permanently erase all students, staff, payments, seats, attendance,
                                leads, and expenses for this library. <strong>This action cannot be undone.</strong>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="type-confirm">
                                    Type <span className="font-semibold text-error">DELETE</span> to continue:
                                </Label>
                                <Input
                                    id="type-confirm"
                                    value={typedConfirmation}
                                    onChange={(e) => setTypedConfirmation(e.target.value)}
                                    placeholder="DELETE"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    )}

                    {cleanStep === "otp" && (
                        <div className="grid grid-cols-1 gap-4">
                            <p className="text-sm text-gray-500">
                                We&apos;ve emailed a 6-digit verification code to your registered email. Enter it
                                below to permanently erase this library&apos;s data.
                            </p>
                            {otpError && (
                                <div className="rounded-md bg-lighterror px-3 py-2 text-sm text-error">{otpError}</div>
                            )}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="clean-otp">Verification Code</Label>
                                <Input
                                    id="clean-otp"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    autoComplete="one-time-code"
                                />
                            </div>
                        </div>
                    )}

                    {cleanStep === "done" && deletedSummary && (
                        <div className="grid grid-cols-1 gap-4">
                            <div className="rounded-md bg-lightsuccess px-3 py-2.5 text-sm text-success font-medium">
                                Library data has been cleaned successfully.
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 rounded-lg border border-border p-3 bg-slate-50 dark:bg-darkcard">
                                {Object.entries(deletedSummary).map(([key, count]) => (
                                    <div key={key} className="text-xs">
                                        <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                                        <span className="font-bold text-dark dark:text-white">{count}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-darklink">
                                You will now be logged out. Please log in again to begin with a fresh workspace.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2 mt-4">
                        {cleanStep === "confirm-type" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setCleanModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-error hover:bg-error/90 text-white"
                                    onClick={requestOtp}
                                    disabled={typedConfirmation !== "DELETE" || sendingOtp}
                                >
                                    {sendingOtp ? "Sending code..." : "Send Verification Code"}
                                </Button>
                            </>
                        )}
                        {cleanStep === "otp" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setCleanModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-error hover:bg-error/90 text-white"
                                    onClick={confirmClean}
                                    disabled={otp.length !== 6 || confirming}
                                >
                                    {confirming ? "Erasing..." : "Confirm & Clean Data"}
                                </Button>
                            </>
                        )}
                        {cleanStep === "done" && (
                            <Button
                                className="w-full bg-primary hover:bg-primary/90 text-white"
                                onClick={handleDoneLogout}
                            >
                                OK, Log In Again
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
