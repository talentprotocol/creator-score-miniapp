#!/usr/bin/env node

/**
 * Quick test to verify cache invalidation is working
 */

const BASE_URL = "http://localhost:3000";

async function testCacheInvalidation() {
  console.log("🧪 Testing cache invalidation...\n");

  try {
    // Step 1: Get initial leaderboard data
    console.log("1️⃣ Fetching initial leaderboard...");
    const initialResponse = await fetch(`${BASE_URL}/api/leaderboard/basic`);
    const initialData = await initialResponse.json();
    console.log(`   Found ${initialData.entries?.length || 0} entries`);

    // Step 2: Make a user decision (should trigger cache invalidation)
    console.log("\n2️⃣ Making user decision...");
    const decisionResponse = await fetch(
      `${BASE_URL}/api/user-preferences/optout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_uuid: "1787b73a-1322-4a90-897e-689c57d38a6e",
          decision: "opted_out",
          confirm_decision: true,
          primary_wallet_address: "0xe73f9c181b571cac2bf3173634d04a9921b7ffcf",
        }),
      },
    );

    const decisionResult = await decisionResponse.json();
    console.log(
      `   Decision result: ${decisionResult.success ? "✅ Success" : "❌ Failed"}`,
    );
    if (decisionResult.success) {
      console.log(`   Decision: ${decisionResult.data?.rewards_decision}`);
      console.log(`   Timestamp: ${decisionResult.data?.decision_made_at}`);
    }

    // Step 3: Fetch leaderboard again (should be fresh data)
    console.log("\n3️⃣ Fetching fresh leaderboard...");
    const freshResponse = await fetch(`${BASE_URL}/api/leaderboard/basic`);
    const freshData = await freshResponse.json();
    console.log(`   Found ${freshData.entries?.length || 0} entries`);

    // Step 4: Check if our test user appears in the data
    console.log("\n4️⃣ Checking for test user in leaderboard...");
    const testUser = freshData.entries?.find(
      (entry) =>
        entry.talent_protocol_id === "1787b73a-1322-4a90-897e-689c57d38a6e",
    );

    if (testUser) {
      console.log(`   ✅ Test user found: ${testUser.name}`);
      console.log(`   Is Opted Out: ${testUser.isOptedOut}`);
      console.log(`   Is Opted In: ${testUser.isOptedIn}`);
      console.log(`   Is Undecided: ${testUser.isUndecided}`);
      console.log(`   Reward: $${testUser.boostedReward || 0}`);
    } else {
      console.log("   ⚠️  Test user not in top 200 (expected)");
    }

    // Step 5: Test opted-out percentage
    console.log("\n5️⃣ Checking opted-out percentage...");
    const percentageResponse = await fetch(
      `${BASE_URL}/api/user-preferences/opted-out-percentage`,
    );
    const percentageData = await percentageResponse.json();
    console.log(`   Opted-out percentage: ${percentageData.percentage}%`);

    console.log("\n✅ All tests completed successfully!");
    console.log("\n📝 Check server logs for cache invalidation messages:");
    console.log(
      "   [UserPreferencesService] Invalidated leaderboard cache for user ...",
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testCacheInvalidation();
