import React from "react";
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { searchParams } = new URL(req.url);
    const talentUUID = searchParams.get("talentUUID");
    const level = searchParams.get("level");
    const title = searchParams.get("title");

    // Debug logging
    console.log("[Badge Share Image] Request params:", {
      slug: params.slug,
      talentUUID,
      level,
      title,
    });

    // Validate required parameters
    if (!talentUUID || !level || !title) {
      console.error("[Badge Share Image] Missing parameters:", {
        talentUUID,
        level,
        title,
      });
      return NextResponse.json(
        { error: "Missing required parameters: talentUUID, level, title" },
        { status: 400 },
      );
    }

    // Detect current deployment URL for asset loading (fonts, images)
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXT_PUBLIC_URL || "https://creatorscore.app";

    // Load fonts (reusing existing pattern)
    const [cyRegular, cyBold, cyExtraBold] = await Promise.all([
      fetch(`${baseUrl}/fonts/Cy Regular.ttf`).then((res) => res.arrayBuffer()),
      fetch(`${baseUrl}/fonts/Cy Bold.ttf`).then((res) => res.arrayBuffer()),
      fetch(`${baseUrl}/fonts/Cy ExtraBold.ttf`).then((res) =>
        res.arrayBuffer(),
      ),
    ]);

    // Determine badge artwork URL
    const badgeSlug = params.slug;
    const badgeLevel = parseInt(level);
    const earnedSuffix = badgeLevel > 0 ? "earned" : "locked";
    const badgeArtwork = `${baseUrl}/images/badges/${badgeSlug}/${badgeSlug}-${badgeLevel || 1}-${earnedSuffix}.webp`;

    // Debug logging
    console.log("[Badge Share Image] Asset URLs:", {
      baseUrl,
      badgeSlug,
      badgeLevel,
      earnedSuffix,
      badgeArtwork,
    });

    // Generate image (temporarily remove caching for debugging)
    console.log("[Badge Share Image] Starting ImageResponse generation");
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            position: "relative",
            backgroundColor: "#F5F5F5",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Badge Placeholder - Centered */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 300,
              height: 300,
              backgroundColor: "#8E7BE5",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 24,
              fontFamily: "Cy",
              fontWeight: 700,
            }}
          >
            Badge
          </div>

          {/* Badge Title */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "75%",
              transform: "translateX(-50%)",
              fontSize: 48,
              fontFamily: "Cy",
              fontWeight: 800,
              color: "#000000",
              lineHeight: 1,
              textAlign: "center",
              maxWidth: 800,
            }}
          >
            {title}
          </div>

          {/* Level Label (if earned) */}
          {badgeLevel > 0 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "83%",
                transform: "translateX(-50%)",
                fontSize: 32,
                fontFamily: "Cy",
                fontWeight: 600,
                color: "#6C7587",
                lineHeight: 1,
                textAlign: "center",
              }}
            >
              Level {badgeLevel}
            </div>
          )}

          {/* Creator Score Logo - Bottom Right */}
          <div
            style={{
              position: "absolute",
              right: 40,
              bottom: 40,
              fontSize: 20,
              fontFamily: "Cy",
              fontWeight: 700,
              color: "#000000",
            }}
          >
            Creator Score
          </div>
        </div>
      ),
      {
        width: 1600,
        height: 900,
        fonts: [
          {
            name: "Cy",
            data: cyRegular,
            weight: 400,
          },
          {
            name: "Cy",
            data: cyBold,
            weight: 700,
          },
          {
            name: "Cy",
            data: cyExtraBold,
            weight: 800,
          },
        ],
      },
    );

    // Set appropriate headers
    const response = new Response(imageResponse.body, {
      headers: {
        ...imageResponse.headers,
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });

    return response;
  } catch (error) {
    console.error("Error generating badge share image:", error);
    return NextResponse.json(
      {
        error: "Failed to generate badge image",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

// Enable runtime edge for better performance
export const runtime = "edge";
