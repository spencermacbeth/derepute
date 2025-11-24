import * as dotenv from "dotenv";
import { OnionooClient } from "./clients/onionoo";
import { RelayDataTransformer } from "./transformers/relayData";

dotenv.config();

/**
 * Script to fetch and display Tor relay data from Onionoo API
 * Useful for testing and exploring the data without updating the contract
 */
async function main() {
  console.log("🔍 Fetching Tor Relay Data from Onionoo API\n");
  console.log("=".repeat(60) + "\n");

  const onionooBaseUrl =
    process.env.ONIONOO_BASE_URL || "https://onionoo.torproject.org";
  const maxRelays = parseInt(process.env.MAX_RELAYS_TO_FETCH || "20");

  const client = new OnionooClient(onionooBaseUrl);

  try {
    // Check API status
    console.log("📊 Checking Onionoo API status...\n");
    const status = await client.getApiStatus();
    console.log(`   API Version: ${status.version}`);
    console.log(`   Last Updated: ${status.relaysPublished}\n`);

    // Fetch top relays
    console.log(`📡 Fetching top ${maxRelays} relays by consensus weight...\n`);
    const onionooRelays = await client.fetchTopRelays(maxRelays);

    // Transform to contract format
    const relayData = RelayDataTransformer.transformRelays(onionooRelays, {
      filterInvalid: true,
      sortBy: "consensusWeight",
    });

    console.log("\n" + "=".repeat(60) + "\n");

    // Display relay information
    console.log(`📋 Relay Details (${relayData.length} relays):\n`);

    relayData.forEach((relay, index) => {
      console.log(`${index + 1}. ${relay.nickname}`);
      console.log(`   Fingerprint: ${relay.fingerprint}`);
      console.log(`   Flags: ${relay.flags.join(", ") || "None"}`);
      console.log(`   Uptime: ${(relay.uptime / 10).toFixed(1)}%`);
      console.log(
        `   Bandwidth: ${(relay.bandwidth / 1000000).toFixed(2)} MB/s`
      );
      console.log(`   Consensus Weight: ${relay.consensusWeight}`);
      console.log(`   Country: ${relay.country}`);
      console.log(`   AS Number: ${relay.asNumber}`);
      console.log(`   Running: ${relay.running ? "Yes" : "No"}`);
      console.log(
        `   Last Seen: ${new Date(relay.lastSeen * 1000).toISOString()}\n`
      );
    });

    // Display summary statistics
    const stats = RelayDataTransformer.getSummaryStats(relayData);

    console.log("=".repeat(60) + "\n");
    console.log("📊 Summary Statistics:\n");
    console.log(`   Total relays: ${stats.totalRelays}`);
    console.log(`   Running relays: ${stats.runningRelays}`);
    console.log(
      `   Total bandwidth: ${(stats.totalBandwidth / 1000000000).toFixed(2)} GB/s`
    );
    console.log(`   Average uptime: ${(stats.avgUptime / 10).toFixed(1)}%\n`);

    console.log("   Flag distribution:");
    Object.entries(stats.flagCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([flag, count]) => {
        console.log(`     ${flag}: ${count}`);
      });

    console.log("\n   Country distribution (top 10):");
    Object.entries(stats.countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([country, count]) => {
        console.log(`     ${country}: ${count}`);
      });

    console.log("\n✅ Data fetch complete!\n");
  } catch (error: any) {
    console.error("\n❌ Error fetching relay data:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
