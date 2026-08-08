"use client";

import { useRef, useState, DragEvent } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

const EXTENSION_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

interface ImageUploadFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  maxSizeMb?: number;
  /** e.g. ["jpg","jpeg","png"] — from Admin Settings -> General. Defaults to any image type. */
  acceptedExtensions?: string[];
  id?: string;
}

export default function ImageUploadField({ value, onChange, existingUrl, maxSizeMb = 2, acceptedExtensions, id }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = value ? URL.createObjectURL(value) : existingUrl || null;
  const acceptedMimes = acceptedExtensions?.map((ext) => EXTENSION_MIME_TYPES[ext.toLowerCase()]).filter((m): m is string => !!m);
  const acceptAttr = acceptedExtensions?.length ? acceptedExtensions.map((ext) => `.${ext.toLowerCase()}`).join(",") : "image/*";

  const validateAndSet = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (acceptedMimes?.length && !acceptedMimes.includes(file.type)) {
      setError(`Allowed formats: ${acceptedExtensions!.join(", ").toUpperCase()}.`);
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Image must be smaller than ${maxSizeMb}MB.`);
      return;
    }
    onChange(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 cursor-pointer transition-colors ${
          dragging ? "border-primary bg-lightprimary" : "border-border hover:border-primary/50"
        }`}
      >
        {preview ? (
          <div className="relative">
            <Image src={preview} alt="Preview" width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); setError(null); }}
              className="absolute -top-1 -right-1 rounded-full bg-error text-white p-1 hover:bg-error/80"
              aria-label="Remove image"
            >
              <Icon icon="tabler:x" width={16} height={16} />
            </button>
          </div>
        ) : (
          <>
            <Icon icon="tabler:photo-plus" width={28} height={28} className="text-darklink" />
            <p className="text-xs text-gray-500 text-center">
              Drag & drop an image, or <span className="text-primary font-medium">click to upload</span>
            </p>
          </>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndSet(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
