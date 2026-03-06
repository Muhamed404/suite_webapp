import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // This is a mockup to prevent 404 since AWM backend does not have this endpoint implemented.
    try {
        const body = await req.json();
        console.log(`[AWM Mock API] Survey ${id} submitted:`, body);

        return NextResponse.json({
            success: true,
            message: "Survey submitted successfully",
            data: {
                survey_id: parseInt(id, 10),
                status: "COMPLETED"
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: "Invalid payload"
        }, { status: 400 });
    }
}
