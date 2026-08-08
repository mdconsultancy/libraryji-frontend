"use client";

import { useApi } from "@/hooks/useApi";

interface UploadLimits {
  max_upload_size_mb: number;
  allowed_extensions: string[];
}

/**
 * Image size/format limits from Admin Settings -> General (public endpoint,
 * same values the backend itself validates against) — lets upload fields
 * reject a bad file before it's ever sent, instead of only via a 422.
 */
export function useUploadLimits() {
  const { data } = useApi<UploadLimits>("/upload-limits");

  return {
    maxSizeMb: data?.max_upload_size_mb ?? 2,
    acceptedExtensions: data?.allowed_extensions ?? ["jpg", "jpeg", "png"],
  };
}
