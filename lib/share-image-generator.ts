import { createCanvas, loadImage, registerFont } from "canvas";
import { formatK, formatNumberWithSuffix } from "@/lib/utils";

interface ShareImageData {
  avatar?: string;
  name: string;
  totalFollowers: number;
  creatorScore: number;
  totalEarnings: number;
}

// Register all Cy font weights
registerFont("public/fonts/Cy Regular.ttf", { family: "Cy", weight: "400" });
registerFont("public/fonts/Cy Bold.ttf", { family: "Cy", weight: "700" });
registerFont("public/fonts/Cy SemiBold.ttf", { family: "Cy", weight: "600" });
registerFont("public/fonts/Cy ExtraBold.ttf", { family: "Cy", weight: "800" });

export async function generateShareImage(
  data: ShareImageData,
): Promise<Buffer> {
  const canvas = createCanvas(1600, 900);
  const ctx = canvas.getContext("2d");

  // Load background image (contains all static elements)
  const background = await loadImage("public/images/share/background.png");
  ctx.drawImage(background, 0, 0, 1600, 900);

  // Avatar - using exact Figma coordinates
  if (data.avatar) {
    try {
      const avatar = await loadImage(data.avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(324.5, 220.5, 119.5, 0, 2 * Math.PI); // Center: 324.5, 220.5, Radius: 119.5 (diameter 239)
      ctx.clip();
      ctx.drawImage(avatar, 205, 101, 239, 239); // Position to center the avatar
      ctx.restore();
    } catch {
      // Fallback avatar circle
      ctx.fillStyle = "#D1D5DB";
      ctx.beginPath();
      ctx.arc(324.5, 220.5, 119.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Name text - using exact Figma coordinates (left edge, baseline)
  ctx.font = "800 66px Cy"; // ExtraBold weight
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  // Strip emojis from name to prevent rendering issues
  const cleanName = data.name.replace(
    /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]|[\u2300-\u23FF]|[\u2000-\u206F]|[\u2100-\u214F]/g,
    "",
  );
  ctx.fillText(cleanName, 470, 217.8); // X: 470 (left), Y: 217.8 (baseline)

  // Total followers text - using exact Figma coordinates (left edge, baseline)
  ctx.font = "600 36px Cy"; // SemiBold weight
  ctx.fillStyle = "#6C7587";
  ctx.textAlign = "left";
  ctx.fillText(`${formatK(data.totalFollowers)} total followers`, 467, 268.8); // X: 467 (left), Y: 268.8 (baseline)

  // Creator Score label - using exact Figma coordinates (center, baseline)
  ctx.font = "700 32px Cy"; // Bold weight
  ctx.fillStyle = "#6C7587";
  ctx.textAlign = "center";
  ctx.fillText("Creator Score", 533.5, 440.6); // X: 533.5 (center), Y: 440.6 (baseline)

  // Creator Score number - using exact Figma coordinates (center, baseline)
  ctx.font = "800 100px Cy"; // ExtraBold weight
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText(data.creatorScore.toLocaleString(), 533.5, 546); // X: 533.5 (center), Y: 546 (baseline)

  // Total Earnings label - using exact Figma coordinates (center, baseline)
  ctx.font = "700 32px Cy"; // Bold weight
  ctx.fillStyle = "#6C7587";
  ctx.textAlign = "center";
  ctx.fillText("Total Earnings", 1098.5, 440.6); // X: 1098.5 (center), Y: 440.6 (baseline)

  // Total Earnings number - using exact Figma coordinates (center, baseline)
  ctx.font = "800 100px Cy"; // ExtraBold weight
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText(formatNumberWithSuffix(data.totalEarnings), 1098.5, 546); // X: 1098.5 (center), Y: 546 (baseline)

  return canvas.toBuffer("image/png");
}
