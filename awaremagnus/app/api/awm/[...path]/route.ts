import { NextRequest, NextResponse } from "next/server";

const SERVICE_AWM_URL = process.env.NEXT_PUBLIC_SERVICE_AWM_URL ?? "http://localhost:3002";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;

    // Construct the backend URL
    // Incoming request: /awm/api/awm/path/to/resource
    // params.path: ['path', 'to', 'resource']
    // Target: SERVICE_AWM_URL + /api/awm/ + path.join('/')

    const endpoint = path.join("/");
    const cleanBase = SERVICE_AWM_URL.replace(/\/+$/, "");
    // We explicitly add /api/awm because this route handler handles /api/awm requests
    // and we want to forward them to the backend's /api/awm structure.
    const targetUrl = new URL(`${cleanBase}/api/awm/${endpoint}`);

    // Append query parameters
    req.nextUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    const headers = new Headers();
    req.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (['host', 'connection', 'content-length', 'transfer-encoding', 'origin', 'referer', 'cookie'].includes(lowerKey)) return;
        headers.set(key, value);
    });

    // Forward cookies explicitly if needed, but usually we just want the Authorization header.
    // If the backend relies on cookies (like awm_session), we should forward them.
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
        headers.set("cookie", cookieHeader);
    }

    try {
        const hasBody = !['GET', 'HEAD'].includes(req.method);
        const body = hasBody ? req.body : undefined;

        const upstreamResponse = await fetch(targetUrl.toString(), {
            method: req.method,
            headers: headers,
            body: body,
            // @ts-ignore
            duplex: hasBody ? 'half' : undefined,
        });

        const responseHeaders = new Headers(upstreamResponse.headers);
        responseHeaders.delete('server');
        responseHeaders.delete('x-powered-by');
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');

        return new NextResponse(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: responseHeaders
        });

    } catch (error: any) {
        console.error("AWM Proxy error:", error);
        return NextResponse.json({ error: "Service unavailable" }, { status: 502 });
    }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
export const HEAD = proxyHandler;
