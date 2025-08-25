import React from "react";
import { ImageResponse } from "next/og";

export async function GET() {
  try {
    console.log("[Simple Badge] Test");
    
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            backgroundColor: "#F5F5F5",
            alignItems: "center",
            justifyContent: "center",
            color: "#000000",
            fontSize: 48,
            fontFamily: "system-ui",
          }}
        >
          Badge Share Image Test
        </div>
      ),
      {
        width: 1600,
        height: 900,
      },
    );
  } catch (error) {
    console.error("Simple badge error:", error);
    return new Response("Error", { status: 500 });
  }
}

export const runtime = "edge";
