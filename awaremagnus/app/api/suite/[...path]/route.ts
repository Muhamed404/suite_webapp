import { NextRequest, NextResponse } from "next/server";

const SERVICE_SUITE_URL =
  process.env.SERVICE_SUITE_URL ||
  process.env.NEXT_PUBLIC_SERVICE_SUITE_URL ||
  "http://localhost:3000";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  // Incoming: /awm/api/suite/login
  // params.path: ['login']
  // Target: SERVICE_SUITE_URL + /login

  const endpoint = path.join("/");
  const cleanBase = SERVICE_SUITE_URL.replace(/\/+$/, "");

  let targetUrl: URL;

  try {
    targetUrl = new URL(`${cleanBase}/${endpoint}`);
  } catch (e) {
    console.error("Invalid URL construction:", { cleanBase, endpoint, SERVICE_SUITE_URL });

    return NextResponse.json(
      { error: "Invalid configuration: Backend URL is not absolute" },
      { status: 500 }
    );
  }

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

  const cookieHeader = req.headers.get("cookie");

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  // Log the proxy attempt
  console.log(`[Suite Proxy] ${req.method} ${targetUrl.toString()}`);

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
          `[Suite Proxy Backend Error] Status: ${upstreamResponse.status} Body: ${errorData.slice(0, 500)}`
        );
      } catch (e) {
        console.error(
          `[Suite Proxy Backend Error] Status: ${upstreamResponse.status} (Could not read body)`
        );
      }
    } else {
      console.log(`[Suite Proxy] Success: ${upstreamResponse.status} for ${targetUrl.toString()}`);
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
      `[Suite Proxy Network Error] ${req.method} ${targetUrl.toString()}: ${error.message || error}`
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
