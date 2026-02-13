import { NextRequest, NextResponse } from "next/server";

const SERVICE_AWM_URL = process.env.NEXT_PUBLIC_SERVICE_AWM_URL ?? "http://localhost:3002";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;

    // Incoming: /awm/contents/img.png
    // params.path: ['img.png']
    // Target: SERVICE_AWM_URL + /contents/ + path

    const endpoint = path.join("/");
    const cleanBase = SERVICE_AWM_URL.replace(/\/+$/, "");
    const targetUrl = new URL(`${cleanBase}/contents/${endpoint}`);

    try {
        const upstreamResponse = await fetch(targetUrl.toString(), {
            method: req.method,
            // Forward minimal headers for assets
            headers: {
                'Accept': req.headers.get('accept') || '*/*',
            }
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
        console.error("Asset Proxy error:", error);
        return new NextResponse(null, { status: 404 });
    }
}

export const GET = proxyHandler;
export const HEAD = proxyHandler;
