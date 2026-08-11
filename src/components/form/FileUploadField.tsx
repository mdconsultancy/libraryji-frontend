"use client";

import { useRef, useState, DragEvent } from "react";
import { Icon } from "@iconify/react";

interface FileUploadFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
  accept?: string;
  maxSizeMb?: number;
  uploading?: boolean;
  id?: string;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|svg)$/i;

export default function FileUploadField({
  value,
  onChange,
  existingUrl,
  accept = ".jpg,.jpeg,.png,.webp,.svg",
  maxSizeMb = 4,
  uploading = false,
  id,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileName = value?.name || (existingUrl ? existingUrl.split("/").pop() : null);
  const isImage = value ? value.type.startsWith("image/") : IMAGE_EXT.test(existingUrl || "");
  const previewUrl = value ? URL.createObjectURL(value) : isImage ? existingUrl : null;

  const validateAndSet = (file: File) => {
    setError(null);
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be smaller than ${maxSizeMb}MB.`);
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
        className={`flex items-center gap-3 rounded-md border-2 border-dashed p-3 cursor-pointer transition-colors ${
          dragging ? "border-primary bg-lightprimary" : "border-border hover:border-primary/50"
        }`}
      >
        {previewUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Preview" className="h-10 w-10 rounded object-cover shrink-0" />
        ) : (
          <Icon icon="tabler:file" width={24} height={24} className="text-darklink shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {fileName ? (
            <p className="text-sm truncate">{fileName}</p>
          ) : (
            <p className="text-xs text-gray-500">
              Drag & drop a file, or <span className="text-primary font-medium">click to upload</span>
            </p>
          )}
          {uploading && <p className="text-xs text-primary mt-0.5">Uploading...</p>}
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); setError(null); }}
            className="text-error hover:text-error/80 shrink-0"
            aria-label="Remove file"
          >
            <Icon icon="solar:trash-bin-trash-linear" width={18} height={18} />
          </button>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
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
