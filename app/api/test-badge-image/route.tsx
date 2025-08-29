import React from "react";
import { ImageResponse } from "next/og";

export async function GET() {
  try {
    console.log("[Test Badge Image] Starting simple test");
    
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
          <div style={{ fontSize: 60, fontWeight: "bold" }}>
            Badge Test
          </div>
          <div style={{ fontSize: 40, marginTop: 20 }}>
            Working!
          </div>
        </div>
      ),
      {
        width: 1600,
        height: 900,
      },
    );
  } catch (error) {
    console.error("Test badge image error:", error);
    return new Response("Error", { status: 500 });
  }
}

export const runtime = "edge";
