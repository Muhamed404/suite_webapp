import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // This is a mockup to prevent 404 since AWM backend does not have this endpoint implemented.
    try {
        const body = await req.json();
        console.log(`[AWM Mock API] Survey ${id} submitted:`, body);

        return NextResponse.json({
            message: "Survey submitted successfully",
            statusCode: 200,
            alertType: "success",
            object: {
                survey_id: parseInt(id, 10),
                status: "COMPLETED"
            }
        });
    } catch (error) {
        return NextResponse.json({
            message: "Invalid payload",
            statusCode: 400,
            alertType: "error",
            object: null
        }, { status: 400 });
    }
}
