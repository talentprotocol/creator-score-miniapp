import React from "react";
import { ImageResponse } from "next/og";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const talentUUID = searchParams.get("talentUUID");
    const level = searchParams.get("level");
    const title = searchParams.get("title");

    console.log("[Minimal Badge] Params:", { slug: params.slug, talentUUID, level, title });

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#8E7BE5",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            color: "white",
            fontFamily: "system-ui",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: "bold" }}>
            {params.slug} Badge
          </div>
          <div style={{ fontSize: 32, marginTop: 20 }}>
            {title} - Level {level}
          </div>
        </div>
      ),
      {
        width: 1600,
        height: 900,
      },
    );
  } catch (error) {
    console.error("Minimal badge error:", error);
    return new Response(`Error: ${error}`, { status: 500 });
  }
}

export const runtime = "edge";
