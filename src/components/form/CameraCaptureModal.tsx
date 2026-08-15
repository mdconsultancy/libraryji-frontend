"use client";

import { useRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Live camera capture via getUserMedia — a real webcam/phone-camera preview
 * with a permission prompt, not the OS file-picker `capture` attribute
 * (which desktop browsers mostly ignore and just open a plain file dialog).
 * Shared by ImageUploadField (student photo) and FileUploadField (ID proofs).
 */
export default function CameraCaptureModal({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!open) {
      stopStream();
      setReady(false);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setError(
          name === "NotAllowedError" || name === "PermissionDeniedError"
            ? "Camera permission was denied. Allow camera access in your browser settings and try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "Unable to access the camera. Please try again."
        );
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
        onClose();
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Take Photo</DialogTitle>
        </DialogHeader>

        <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-black aspect-square">
          {error ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <Icon icon="solar:camera-off-line-duotone" width={32} height={32} className="text-white/70" />
              <p className="text-sm text-white/90">{error}</p>
            </div>
          ) : (
            <>
              {!ready && (
                <Icon icon="svg-spinners:180-ring" width={32} height={32} className="absolute text-white" />
              )}
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} className="h-full w-full object-cover -scale-x-100" muted playsInline />
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={capture} disabled={!ready || !!error}>
            <Icon icon="tabler:camera" width={16} height={16} className="mr-1.5" />
            Capture
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
