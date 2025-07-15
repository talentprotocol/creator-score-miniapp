/**
 * Triggers Creator Score calculation for a Talent Protocol ID
 */
export async function triggerScoreCalculation(
  talentId: string | number,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    console.log("🔄 triggerScoreCalculation called with talentId:", talentId);

    // Always use relative path to avoid CORS issues and ensure we use our API routes
    let baseUrl = "";
    if (typeof window !== "undefined") {
      // Client-side: use relative path to ensure we call our own API routes
      baseUrl = "";
    } else {
      // Server-side: use the current origin
      baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_URL || "";
    }

    const requestBody = {
      talent_protocol_id: String(talentId),
    };
    console.log(
      "📤 Sending POST request to /api/talent-score-refresh with body:",
      requestBody,
    );

    const response = await fetch(`${baseUrl}/api/talent-score-refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Response status:", response.status, response.statusText);

    const data = await response.json();
    console.log("📥 Response data:", data);

    if (!response.ok) {
      console.log("❌ Request failed with status:", response.status);
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log("✅ Request successful");
    return {
      success: true,
      message: data.score || "Calculation enqueued",
    };
  } catch (error) {
    console.log("❌ Exception in triggerScoreCalculation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to trigger score calculation",
    };
  }
}
