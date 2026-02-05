"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

import { useAuthStore } from "@/hooks/useAuthStore";
import { getContentAssetUrl } from "@/utils/contentAssetUrl";

interface AuthImageProps {
  /** Relative path (e.g. /contents/...) or full URL. Full http(s) URLs are fetched with auth when same-origin or configured backend. */
  src: string | null | undefined;
  alt: string;
  /** Fill the container (requires parent with position relative and dimensions) */
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  /** Use Next/Image unoptimized for external URLs that are not fetched with auth */
  unoptimized?: boolean;
  /** Optional: resolve path with getContentAssetUrl (default true for relative paths) */
  resolveUrl?: boolean;
}

/**
 * Renders an image from a URL that requires Authorization Bearer token.
 * Fetches the image with fetch() and the auth token, then displays via blob URL.
 * Use for content logos and document sources from the AWM backend.
 */
export function AuthImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  unoptimized = false,
  resolveUrl = true,
}: AuthImageProps) {
  const token = useAuthStore((s) => s.token);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const urlToFetch =
    !src?.trim() ? "" : resolveUrl ? getContentAssetUrl(src) : src.trim();
  const isAbsolute = urlToFetch.startsWith("http://") || urlToFetch.startsWith("https://");

  useEffect(() => {
    if (!urlToFetch || !isAbsolute) {
      setObjectUrl(null);
      setError(!!src?.trim() && !urlToFetch);
      return;
    }
    setError(false);
    const controller = new AbortController();
    const headers: HeadersInit = {
      "ngrok-skip-browser-warning": "true",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(urlToFetch, { headers, signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Image ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = url;
        setObjectUrl(url);
      })
      .catch(() => {
        setObjectUrl(null);
        setError(true);
      });

    return () => {
      controller.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setObjectUrl(null);
    };
  }, [urlToFetch, token, isAbsolute]);

  if (!src?.trim()) return null;
  if (!isAbsolute) return null;
  if (error || !objectUrl) {
    return (
      <div
        className={className}
        style={
          fill
            ? undefined
            : { width: width ?? 48, height: height ?? 48, background: "var(--gray)" }
        }
        title={alt}
      >
        <span className="text-[var(--darkgray)] text-xs">—</span>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        alt={alt}
        src={objectUrl}
        fill
        className={className}
        sizes={sizes}
        unoptimized
      />
    );
  }

  return (
    <Image
      alt={alt}
      src={objectUrl}
      width={width ?? 48}
      height={height ?? 48}
      className={className}
      unoptimized
    />
  );
}
