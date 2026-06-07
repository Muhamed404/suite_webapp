import { NextRequest, NextResponse } from "next/server";

const SERVICE_JNR_URL =
  process.env.SERVICE_JNR_URL || process.env.NEXT_PUBLIC_SERVICE_JNR_URL || "http://localhost:3001";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  // Construct the backend URL
  // Incoming request: /jnr/api/jnr/path/to/resource
  // params.path: ['path', 'to', 'resource']
  // Target: SERVICE_JNR_URL + /api/jnr/ + path.join('/')

  const endpoint = path.join("/");
  const cleanBase = SERVICE_JNR_URL.replace(/\/+$/, "");

  // We explicitly add /api/jnr because this route handler handles /api/jnr requests
  // and we want to forward them to the backend's /api/jnr structure.
  let targetUrl: URL;

  try {
    targetUrl = new URL(`${cleanBase}/api/jnr/${endpoint}`);
  } catch (e) {
    console.error("Invalid AWM URL construction:", { cleanBase, endpoint, SERVICE_JNR_URL });

    return NextResponse.json(
      { error: "Invalid AWM configuration: Backend URL is not absolute" },
      { status: 500 }
    );
  }

  // Append query parameters
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const headers = new Headers();

  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    if (
      [
        "host",
        "connection",
        "content-length",
        "transfer-encoding",
        "origin",
        "referer",
        "cookie",
      ].includes(lowerKey)
    )
      return;
    headers.set(key, value);
  });

  // Forward cookies explicitly if needed, but usually we just want the Authorization header.
  // If the backend relies on cookies (like jnr_session), we should forward them.
  const cookieHeader = req.headers.get("cookie");

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  // Log the proxy attempt
  console.log(`[AWM Proxy] ${req.method} ${targetUrl.toString()}`);

  try {
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const body = hasBody ? req.body : undefined;

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: headers,
      body: body,
      // @ts-ignore
      duplex: hasBody ? "half" : undefined,
    });

    // Log the response status from the backend
    if (!upstreamResponse.ok) {
      try {
        const errorClone = upstreamResponse.clone();
        const errorData = await errorClone.text();

        console.error(
          `[AWM Proxy Backend Error] Status: ${upstreamResponse.status} Body: ${errorData.slice(0, 500)}`
        );
      } catch (e) {
        console.error(
          `[AWM Proxy Backend Error] Status: ${upstreamResponse.status} (Could not read body)`
        );
      }
    } else {
      console.log(`[AWM Proxy] Success: ${upstreamResponse.status} for ${targetUrl.toString()}`);
    }

    const responseHeaders = new Headers(upstreamResponse.headers);

    responseHeaders.delete("server");
    responseHeaders.delete("x-powered-by");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    // Log a concise error message instead of the full object
    console.error(
      `[AWM Proxy Network Error] ${req.method} ${targetUrl.toString()}: ${error.message || error}`
    );

    return NextResponse.json(
      {
        error: "Service unavailable",
        details: error.message,
        target: targetUrl.toString(),
      },
      { status: 502 }
    );
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
export const HEAD = proxyHandler;
