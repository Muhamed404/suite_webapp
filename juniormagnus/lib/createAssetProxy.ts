/**
 * Shared Asset Proxy Factory
 *
 * Creates Next.js Route Handlers that proxy GET/HEAD requests for static
 * assets (contents, certificates, module_translations) to the AWM backend.
 *
 * Features:
 *  - Forwards Range, Authorization, and cache-related headers
 *  - Preserves upstream response headers (content-type, content-range, etc.)
 *  - Supports HTTP 206 Partial Content for video streaming
 *  - Single implementation for all 3 asset proxy routes
 */

import { NextRequest, NextResponse } from "next/server";

const SERVICE_JNR_URL =
  process.env.SERVICE_JNR_URL ||
  process.env.NEXT_PUBLIC_SERVICE_JNR_URL ||
  "http://localhost:3003";

/** Headers to forward from the client request to the backend */
const FORWARD_HEADERS = [
  "authorization",
  "range",
  "if-range",
  "if-none-match",
  "if-modified-since",
] as const;

/** Headers to preserve from the backend response to the client */
const PRESERVE_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "cache-control",
  "etag",
  "last-modified",
  "content-disposition",
  "access-control-allow-origin",
  "access-control-allow-credentials",
] as const;

/**
 * Creates a pair of GET / HEAD route handlers that proxy requests to the
 * AWM backend under the given path prefix.
 *
 * @param pathPrefix - Backend path prefix, e.g. "contents", "certificates"
 * @returns `{ GET, HEAD }` handlers to export from a Next.js route file
 *
 * @example
 * ```ts
 * // app/contents/[...path]/route.ts
 * import { createAssetProxy } from "@/lib/createAssetProxy";
 * export const { GET, HEAD } = createAssetProxy("contents");
 * ```
 */
export function createAssetProxy(pathPrefix: string) {
  async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
  ) {
    const { path } = await params;
    const endpoint = path.join("/");
    const cleanBase = SERVICE_JNR_URL.replace(/\/+$/, "");

    // Build target URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(`${cleanBase}/${pathPrefix}/${endpoint}`);
    } catch (e) {
      console.error(`[AssetProxy:${pathPrefix}] Invalid URL construction:`, {
        cleanBase,
        endpoint,
        SERVICE_JNR_URL,
      });
      return NextResponse.json(
        { error: "Invalid configuration: AWM Backend URL is not absolute" },
        { status: 500 }
      );
    }

    // Forward query params from the original request
    req.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    // Build headers to forward
    const forwardHeaders: Record<string, string> = {
      Accept: req.headers.get("accept") || "*/*",
    };
    for (const header of FORWARD_HEADERS) {
      const value = req.headers.get(header);
      if (value) forwardHeaders[header] = value;
    }

    try {
      const upstreamResponse = await fetch(targetUrl.toString(), {
        method: req.method,
        headers: forwardHeaders,
      });

      // Build response headers
      const responseHeaders = new Headers();
      for (const header of PRESERVE_HEADERS) {
        const value = upstreamResponse.headers.get(header);
        if (value) responseHeaders.set(header, value);
      }

      return new NextResponse(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    } catch (error: any) {
      console.error(`[AssetProxy:${pathPrefix}] Proxy error:`, error?.message);
      return new NextResponse(null, { status: 502 });
    }
  }

  return { GET: handler, HEAD: handler };
}
