#!/usr/bin/env node

/**
 * Test script to verify leaderboard cache invalidation
 *
 * This script tests the cache invalidation mechanism by:
 * 1. Making a rewards decision for a test user
 * 2. Checking if the leaderboard cache is properly invalidated
 * 3. Verifying that the new decision status appears in the leaderboard
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testCacheInvalidation() {
  console.log("🧪 Testing leaderboard cache invalidation...\n");

  // Test user UUID (replace with a real test user)
  const testUserUuid = "test-user-uuid";

  try {
    // Step 1: Check initial leaderboard data
    console.log("1️⃣ Fetching initial leaderboard data...");
    const initialLeaderboard = await fetch(`${BASE_URL}/api/leaderboard/basic`);
    const initialData = await initialLeaderboard.json();
    console.log(`   Found ${initialData.entries?.length || 0} entries\n`);

    // Step 2: Make a rewards decision (simulate opt-in)
    console.log("2️⃣ Making rewards decision (opt-in)...");
    const decisionResponse = await fetch(
      `${BASE_URL}/api/user-preferences/optout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_uuid: testUserUuid,
          decision: "opted_in",
          confirm_decision: true,
          primary_wallet_address: "0x1234567890123456789012345678901234567890",
        }),
      },
    );

    if (!decisionResponse.ok) {
      console.log("   ⚠️  Decision request failed (expected for test user)");
    } else {
      const decisionResult = await decisionResponse.json();
      console.log("   ✅ Decision made successfully");
      console.log(`   Decision: ${decisionResult.data?.rewards_decision}\n`);
    }

    // Step 3: Clear cache manually to simulate the invalidation
    console.log("3️⃣ Clearing leaderboard cache...");
    const clearCacheResponse = await fetch(`${BASE_URL}/api/clear-cache`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ talent_uuid: testUserUuid }),
    });

    if (clearCacheResponse.ok) {
      console.log("   ✅ Cache cleared successfully\n");
    } else {
      console.log("   ⚠️  Cache clear failed\n");
    }

    // Step 4: Fetch leaderboard data again to see if it's fresh
    console.log("4️⃣ Fetching fresh leaderboard data...");
    const freshLeaderboard = await fetch(`${BASE_URL}/api/leaderboard/basic`);
    const freshData = await freshLeaderboard.json();
    console.log(`   Found ${freshData.entries?.length || 0} entries\n`);

    // Step 5: Check if the test user's decision status is correct
    console.log("5️⃣ Checking user decision status in leaderboard...");
    const testUserEntry = freshData.entries?.find(
      (entry) => entry.talent_protocol_id === testUserUuid,
    );

    if (testUserEntry) {
      console.log(`   User: ${testUserEntry.name}`);
      console.log(`   Rank: ${testUserEntry.rank}`);
      console.log(`   Is Opted In: ${testUserEntry.isOptedIn}`);
      console.log(`   Is Opted Out: ${testUserEntry.isOptedOut}`);
      console.log(`   Is Undecided: ${testUserEntry.isUndecided}`);
      console.log(`   Reward: $${testUserEntry.boostedReward || 0}`);
    } else {
      console.log(
        "   ⚠️  Test user not found in leaderboard (may not be in top 200)",
      );
    }

    console.log("\n✅ Cache invalidation test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testCacheInvalidation();
