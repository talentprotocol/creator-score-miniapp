## Implementation

Create `app/api/share-image/[talentUUID]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";
import { calculateTotalFollowers, formatK, formatNumberWithSuffix } from "@/lib/utils";
import { generateShareImage } from "@/lib/share-image-generator";

export async function GET(
  req: NextRequest,
  { params }: { params: { talentUUID: string } }
) {
  try {
    // Fetch user data
    const profile = await talentApiClient.getProfile({ 
      talent_protocol_id: params.talentUUID 
    });
    
    // Fetch additional data (you'll need to implement these)
    const [socialAccounts, credentials] = await Promise.all([
      // Add your data fetching logic here
      Promise.resolve([]), // socialAccounts
      Promise.resolve([]), // credentials
    ]);

    // Calculate stats
    const totalFollowers = calculateTotalFollowers(socialAccounts);
    const creatorScore = profile.scores?.find(s => s.slug === "creator_score")?.points || 0;
    const totalEarnings = 0; // You'll need to implement earnings calculation

    // Generate image
    const imageBuffer = await generateShareImage({
      avatar: profile.image_url,
      name: profile.display_name || profile.name || "Creator",
      totalFollowers,
      creatorScore,
      totalEarnings,
    });

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating share image:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
```

## Exact Specifications Needed from Figma

Please provide these exact values from the Figma file:

### **Text Positioning & Styling**
1. **Name text**:
   - X, Y coordinates (left, top): 470, 217.8 
   - Font size: 66
   - Font weight: ExtraBold
   - Color hex code: #000000
   - Text alignment: Left

2. **"Total followers" text**:
   - X, Y coordinates (left, top): 467, 268.8
   - Font size: 36
   - Font weight: SemiBold
   - Color hex code: #6C7587
   - Text alignment: Left

3. **Creator Score number**:
   - X, Y coordinates (center, top): 533.5, 546
   - Font size: 100
   - Font weight: ExtraBold
   - Color hex code: #000000
   - Text alignment: Center

4. **"Creator Score" label**:
   - X, Y coordinates (center, top): 533.5, 440.6
   - Font size: 32
   - Font weight: Bold
   - Color hex code: #6C7587
   - Text alignment: Center

5. **Total Earnings number**:
   - X, Y coordinates (center, top): 1098.5, 546
   - Font size: 100
   - Font weight: ExtraBold
   - Color hex code: #000000
   - Text alignment: Center

6. **"Total Earnings" label**:
   - X, Y coordinates (center, top): 1098.5, 440.6
   - Font size: 32
   - Font weight: Bold
   - Color hex code: #6C7587
   - Text alignment: Center

### **Avatar Positioning**
7. **Avatar circle**:
   - Center X, Y coordinates: 324.5, 220.5
   - Diameter: 239

### **Canvas Dimensions**
8. **Overall canvas size**:
   - Width: 1600
   - Height: 900
