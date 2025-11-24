import * as fs from "fs";
import * as path from "path";
import { RelayDataTransformer } from "./transformers/relayData";
import { OnionooRelay, RelayData } from "./types";

/**
 * Process downloaded Tor relay data and transform it to contract format
 */
async function main() {
  console.log("🔄 Processing Downloaded Tor Relay Data\n");
  console.log("=".repeat(60) + "\n");

  const dataFile = path.join(__dirname, "../data/tor-relays-top100.json");

  // Check if file exists
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ Data file not found: ${dataFile}`);
    console.log("\n💡 Run this command to download data:");
    console.log('curl -s "https://onionoo.torproject.org/details?limit=100&running=true&order=-consensus_weight" -o data/tor-relays-top100.json\n');
    process.exit(1);
  }

  // Load the data
  console.log(`📂 Loading data from: ${dataFile}\n`);
  const rawData = fs.readFileSync(dataFile, "utf8");
  const onionooData = JSON.parse(rawData);

  console.log(`📊 Onionoo API Info:`);
  console.log(`   Version: ${onionooData.version}`);
  console.log(`   Last published: ${onionooData.relays_published}`);
  console.log(`   Total relays available: ${onionooData.relays_truncated || "N/A"}`);
  console.log(`   Relays in this dataset: ${onionooData.relays?.length || 0}\n`);

  if (!onionooData.relays || onionooData.relays.length === 0) {
    console.error("❌ No relay data found in file");
    process.exit(1);
  }

  // Transform the data
  const relays: OnionooRelay[] = onionooData.relays;
  const transformedRelays = RelayDataTransformer.transformRelays(relays, {
    filterInvalid: true,
    sortBy: "consensusWeight",
  });

  console.log("\n" + "=".repeat(60) + "\n");

  // Display sample relays
  console.log("📋 Sample Transformed Relays (first 5):\n");
  transformedRelays.slice(0, 5).forEach((relay, index) => {
    console.log(`${index + 1}. ${relay.nickname}`);
    console.log(`   Fingerprint: ${relay.fingerprint}`);
    console.log(`   Flags: ${relay.flags.join(", ")}`);
    console.log(`   Uptime: ${(relay.uptime / 10).toFixed(1)}%`);
    console.log(`   Bandwidth: ${(relay.bandwidth / 1000000).toFixed(2)} MB/s`);
    console.log(`   Consensus Weight: ${relay.consensusWeight.toLocaleString()}`);
    console.log(`   Country: ${relay.country}`);
    console.log(`   AS Number: ${relay.asNumber}`);
    console.log(`   Running: ${relay.running ? "✅ Yes" : "❌ No"}\n`);
  });

  // Summary statistics
  const stats = RelayDataTransformer.getSummaryStats(transformedRelays);

  console.log("=".repeat(60) + "\n");
  console.log("📊 Summary Statistics:\n");
  console.log(`   Total relays: ${stats.totalRelays}`);
  console.log(`   Running relays: ${stats.runningRelays}`);
  console.log(
    `   Total bandwidth: ${(stats.totalBandwidth / 1000000000).toFixed(2)} GB/s`
  );
  console.log(`   Average uptime: ${(stats.avgUptime / 10).toFixed(1)}%\n`);

  console.log("   Top 10 Flags:");
  Object.entries(stats.flagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([flag, count]) => {
      const percentage = ((count / stats.totalRelays) * 100).toFixed(1);
      console.log(`     ${flag.padEnd(15)} ${count.toString().padStart(3)} (${percentage}%)`);
    });

  console.log("\n   Top 10 Countries:");
  Object.entries(stats.countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([country, count]) => {
      const percentage = ((count / stats.totalRelays) * 100).toFixed(1);
      console.log(`     ${country.padEnd(15)} ${count.toString().padStart(3)} (${percentage}%)`);
    });

  // Save transformed data
  const outputFile = path.join(__dirname, "../data/transformed-relays.json");
  fs.writeFileSync(outputFile, JSON.stringify(transformedRelays, null, 2));
  console.log(`\n💾 Transformed data saved to: ${outputFile}`);

  // Save summary stats
  const statsFile = path.join(__dirname, "../data/summary-stats.json");
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  console.log(`📊 Summary statistics saved to: ${statsFile}`);

  // Create batches for contract updates
  const batchSize = 10;
  const batches = RelayDataTransformer.batchRelays(transformedRelays, batchSize);

  const batchesDir = path.join(__dirname, "../data/batches");
  if (!fs.existsSync(batchesDir)) {
    fs.mkdirSync(batchesDir, { recursive: true });
  }

  batches.forEach((batch, index) => {
    const batchFile = path.join(batchesDir, `batch-${index + 1}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2));
  });

  console.log(`📦 Created ${batches.length} batches in: ${batchesDir}`);

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Data processing complete!\n");

  console.log("📋 Next steps:");
  console.log("   1. Review the transformed data in data/transformed-relays.json");
  console.log("   2. Deploy the contract if not already deployed:");
  console.log("      cd ../contracts && npm run deploy:sepolia");
  console.log("   3. Update the contract with the relay data:");
  console.log("      cd ../scripts && npm run update:dry-run");
  console.log("");
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
