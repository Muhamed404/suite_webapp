import { NextRequest, NextResponse } from "next/server";

const SERVICE_AWM_URL = process.env.NEXT_PUBLIC_SERVICE_AWM_URL ?? "http://localhost:3002";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;

    // Incoming: /awm/certificates/system_files/0-11-top_logo-1771488381058.jpg
    // params.path: ['system_files', '0-11-top_logo-1771488381058.jpg']
    // Target: SERVICE_AWM_URL + /certificates/ + path

    const endpoint = path.join("/");
    const cleanBase = SERVICE_AWM_URL.replace(/\/+$/, "");
    const targetUrl = new URL(`${cleanBase}/certificates/${endpoint}`);

    // Forward the original query params if any
    req.nextUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    const forwardHeaders: Record<string, string> = {
        'Accept': req.headers.get('accept') || '*/*',
    };

    const authHeader = req.headers.get('authorization');
    if (authHeader) {
        forwardHeaders['Authorization'] = authHeader;
    }

    try {
        const upstreamResponse = await fetch(targetUrl.toString(), {
            method: req.method,
            headers: forwardHeaders,
        });

        const responseHeaders = new Headers();

        // Preserve important headers from upstream
        const preserveHeaders = [
            'content-type',
            'content-length',
            'cache-control',
            'etag',
            'last-modified',
            'content-disposition',
            'access-control-allow-origin',
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
        console.error("Certificate Asset Proxy error:", error);
        return new NextResponse(null, { status: 404 });
    }
}

export const GET = proxyHandler;
export const HEAD = proxyHandler;
