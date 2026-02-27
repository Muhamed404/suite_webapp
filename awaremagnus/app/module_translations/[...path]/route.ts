import { NextRequest, NextResponse } from "next/server";

const SERVICE_AWM_URL = process.env.NEXT_PUBLIC_SERVICE_AWM_URL ?? "http://localhost:3002";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;

    // Incoming: /awm/module_translations/img.png
    // params.path: ['img.png']
    // Target: SERVICE_AWM_URL + /module_translations/ + path

    const endpoint = path.join("/");
    const cleanBase = SERVICE_AWM_URL.replace(/\/+$/, "");
    const targetUrl = new URL(`${cleanBase}/module_translations/${endpoint}`);

    // Build headers to forward — importantly include Range for video streaming and Auth for protected assets
    const forwardHeaders: Record<string, string> = {
        'Accept': req.headers.get('accept') || '*/*',
    };

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
        forwardHeaders['Authorization'] = authHeader;
    }

    // Forward Range header for video streaming (HTTP 206 Partial Content)
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
        forwardHeaders['Range'] = rangeHeader;
    }

    // Forward If-Range, If-None-Match, If-Modified-Since for caching
    const ifRange = req.headers.get('if-range');
    if (ifRange) forwardHeaders['If-Range'] = ifRange;
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch) forwardHeaders['If-None-Match'] = ifNoneMatch;
    const ifModifiedSince = req.headers.get('if-modified-since');
    if (ifModifiedSince) forwardHeaders['If-Modified-Since'] = ifModifiedSince;

    try {
        const upstreamResponse = await fetch(targetUrl.toString(), {
            method: req.method,
            headers: forwardHeaders,
        });

        const responseHeaders = new Headers();

        // Preserve all important headers from upstream
        const preserveHeaders = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
            'cache-control',
            'etag',
            'last-modified',
            'content-disposition',
            'access-control-allow-origin',
            'access-control-allow-credentials',
        ];

        for (const header of preserveHeaders) {
            const value = upstreamResponse.headers.get(header);
            if (value) {
                responseHeaders.set(header, value);
            }
        }

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