import {
  setUserNotificationDetails,
  deleteUserNotificationDetails,
} from "@/lib/notification";
import { sendFrameNotification } from "@/lib/notification-client";
import { http } from "viem";
import { createPublicClient } from "viem";
import { optimism } from "viem/chains";
import { getUserWalletAddresses } from "@/app/services/neynarService";
import { getBuilderScore } from "@/app/services/talentService";

const appName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME;

const KEY_REGISTRY_ADDRESS = "0x00000000Fc1237824fb747aBDE0FF18990E59b7e";

const KEY_REGISTRY_ABI = [
  {
    inputs: [
      { name: "fid", type: "uint256" },
      { name: "key", type: "bytes" },
    ],
    name: "keyDataOf",
    outputs: [
      {
        components: [
          { name: "state", type: "uint8" },
          { name: "keyType", type: "uint32" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function verifyFidOwnership(fid: number, appKey: `0x${string}`) {
  const client = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  try {
    const result = await client.readContract({
      address: KEY_REGISTRY_ADDRESS,
      abi: KEY_REGISTRY_ABI,
      functionName: "keyDataOf",
      args: [BigInt(fid), appKey],
    });

    return result.state === 1 && result.keyType === 1;
  } catch (error) {
    console.error("Key Registry verification failed:", error);
    return false;
  }
}

function decode(encoded: string) {
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
}

async function getWelcomeMessage(fid: number): Promise<string> {
  const maxAttempts = 3;
  const delayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Get user's wallet addresses
      const walletData = await getUserWalletAddresses(fid);
      if (walletData.error) {
        return `Welcome to ${appName}!`;
      }

      // Get all addresses to check
      const addresses = [
        ...walletData.addresses,
        walletData.primaryEthAddress,
        walletData.primarySolAddress,
      ].filter(
        (addr): addr is string =>
          typeof addr === "string" && addr.startsWith("0x"),
      );

      if (addresses.length === 0) {
        return `Welcome to ${appName}!`;
      }

      // Get Builder Score
      const scoreData = await getBuilderScore(addresses);
      if (!scoreData.error && scoreData.score) {
        return `Welcome to ${appName}! Your Builder Score is ${scoreData.score} (${scoreData.levelName})`;
      }
      // If not last attempt, wait and retry
      if (attempt < maxAttempts) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error("Error getting welcome message:", error);
      }
      // If not last attempt, wait and retry
      if (attempt < maxAttempts) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  // Fallback message if all attempts fail
  return `Welcome to ${appName}!`;
}

export async function POST(request: Request) {
  const requestJson = await request.json();

  const { header: encodedHeader, payload: encodedPayload } = requestJson;

  const headerData = decode(encodedHeader);
  const event = decode(encodedPayload);

  const { fid, key } = headerData;

  const valid = await verifyFidOwnership(fid, key);

  if (!valid) {
    return Response.json(
      { success: false, error: "Invalid FID ownership" },
      { status: 401 },
    );
  }

  switch (event.event) {
    case "frame_added":
      console.log(
        "frame_added",
        "event.notificationDetails",
        event.notificationDetails,
      );
      if (event.notificationDetails) {
        await setUserNotificationDetails(fid, event.notificationDetails);
        const welcomeMessage = await getWelcomeMessage(fid);
        await sendFrameNotification({
          fid,
          title: `Welcome to ${appName}`,
          body: welcomeMessage,
        });
      } else {
        await deleteUserNotificationDetails(fid);
      }
      break;
    case "frame_removed": {
      console.log("frame_removed");
      await deleteUserNotificationDetails(fid);
      break;
    }
    case "notifications_enabled": {
      console.log("notifications_enabled", event.notificationDetails);
      await setUserNotificationDetails(fid, event.notificationDetails);
      const welcomeMessage = await getWelcomeMessage(fid);
      await sendFrameNotification({
        fid,
        title: `Welcome to ${appName}`,
        body: welcomeMessage,
      });
      break;
    }
    case "notifications_disabled": {
      console.log("notifications_disabled");
      await deleteUserNotificationDetails(fid);
      break;
    }
  }

  return Response.json({ success: true });
}
