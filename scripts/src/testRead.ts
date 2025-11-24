import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Test script to verify reading relay data from the contract
 */
async function main() {
  console.log("🧪 Testing Contract Data Retrieval\n");
  console.log("=".repeat(60) + "\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";

  // Load contract ABI
  const abiPath = path.join(
    __dirname,
    "../../contracts/deployments/TorReputationStore-abi.json"
  );
  const contractAbi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

  // Connect to contract (read-only, no signer needed)
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress!, contractAbi, provider);

  try {
    // 1. Get total relay count
    console.log("📊 Contract Statistics:\n");
    const relayCount = await contract.getRelayCount();
    console.log(`   Total relays in contract: ${relayCount.toString()}\n`);

    if (relayCount === 0n) {
      console.log("⚠️  Contract is empty. Upload some data first!");
      return;
    }

    // 2. Get individual relays by index
    console.log("📋 Reading All Relays:\n");
    for (let i = 0; i < Number(relayCount); i++) {
      const fingerprint = await contract.getFingerprintByIndex(i);
      const relay = await contract.getRelay(fingerprint);

      console.log(`${i + 1}. ${relay.nickname}`);
      console.log(`   Fingerprint: ${relay.fingerprint}`);
      console.log(`   Flags: ${relay.flags.join(", ")}`);
      console.log(`   Uptime: ${(Number(relay.uptime) / 10).toFixed(1)}%`);
      console.log(
        `   Bandwidth: ${(Number(relay.bandwidth) / 1000000).toFixed(2)} MB/s`
      );
      console.log(`   Consensus Weight: ${relay.consensusWeight.toString()}`);
      console.log(`   Country: ${relay.country}`);
      console.log(`   AS Number: ${relay.asNumber}`);
      console.log(
        `   Last Seen: ${new Date(Number(relay.lastSeen) * 1000).toISOString()}`
      );
      console.log(`   Running: ${relay.running ? "✅ Yes" : "❌ No"}\n`);
    }

    // 3. Test pagination
    console.log("=".repeat(60) + "\n");
    console.log("📄 Testing Pagination:\n");

    const pageSize = 3;
    const totalPages = Math.ceil(Number(relayCount) / pageSize);

    for (let page = 0; page < totalPages; page++) {
      const offset = page * pageSize;
      const relays = await contract.getRelaysPaginated(offset, pageSize);

      console.log(`Page ${page + 1}/${totalPages} (offset: ${offset}, limit: ${pageSize}):`);
      relays.forEach((relay: any, idx: number) => {
        console.log(`   ${offset + idx + 1}. ${relay.nickname} (${relay.fingerprint.slice(0, 16)}...)`);
      });
      console.log();
    }

    // 4. Check if specific relay exists
    console.log("=".repeat(60) + "\n");
    console.log("🔍 Testing Relay Existence Check:\n");

    const testFingerprint = await contract.getFingerprintByIndex(0);
    const exists = await contract.relayExists(testFingerprint);
    console.log(`   Relay ${testFingerprint.slice(0, 16)}... exists: ${exists}\n`);

    const fakeFingerprint = "A".repeat(40);
    const fakeExists = await contract.relayExists(fakeFingerprint);
    console.log(`   Fake relay ${fakeFingerprint.slice(0, 16)}... exists: ${fakeExists}\n`);

    console.log("=".repeat(60));
    console.log("\n✅ All read tests passed!\n");
  } catch (error: any) {
    console.error("\n❌ Error reading from contract:", error.message);
    if (error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
