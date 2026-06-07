"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import clsx from "clsx";

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
  /** Optional: content to render when image fails to load (e.g. fallback thumbnail) */
  fallbackContent?: React.ReactNode;
  /** Optional: content to render while image is being fetched (e.g. skeleton) */
  loadingContent?: React.ReactNode;
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
  fallbackContent,
  loadingContent,
}: AuthImageProps) {
  const token = useAuthStore((s) => s.token);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const urlToFetch = !src?.trim() ? "" : resolveUrl ? getContentAssetUrl(src) : src.trim();
  const isAbsolute = urlToFetch.startsWith("http://") || urlToFetch.startsWith("https://");

  useEffect(() => {
    if (!urlToFetch) {
      setObjectUrl(null);
      setError(!!src?.trim());

      return;
    }
    setError(false);
    setIsLoading(true);
    const controller = new AbortController();
    const headers: HeadersInit = {};
    const isInternal = !isAbsolute || (typeof window !== "undefined" && urlToFetch.startsWith(window.location.origin)) || urlToFetch.startsWith("/");

    if (isInternal) {
      headers["ngrok-skip-browser-warning"] = "true";
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

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
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setObjectUrl(null);
        setError(true);
        setIsLoading(false);
      });

    return () => {
      controller.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setObjectUrl(null);
      setIsLoading(false);
    };
  }, [urlToFetch, token]);

  if (!src?.trim()) return null;

  if (isLoading) {
    if (loadingContent) return <>{loadingContent}</>;

    return (
      <div
        className={clsx("animate-pulse bg-gray-100", className)}
        style={
          fill ? { width: "100%", height: "100%" } : { width: width ?? 48, height: height ?? 48 }
        }
      />
    );
  }

  if (error || !objectUrl) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }

    return (
      <div
        className={className}
        style={
          fill ? undefined : { width: width ?? 48, height: height ?? 48, background: "var(--gray)" }
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
        fill
        alt={alt}
        className={className}
        sizes={sizes}
        src={objectUrl}
        unoptimized={unoptimized}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={height ?? 48}
      src={objectUrl}
      unoptimized={unoptimized}
      width={width ?? 48}
    />
  );
}
