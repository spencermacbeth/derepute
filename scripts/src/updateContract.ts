import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { OnionooClient } from "./clients/onionoo";
import { RelayDataTransformer } from "./transformers/relayData";
import { RelayData, UpdateResult } from "./types";

dotenv.config();

/**
 * Main script to fetch Tor relay data and update the smart contract
 */
class ContractUpdater {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;
  private onionooClient: OnionooClient;
  private dryRun: boolean;

  constructor(
    contractAddress: string,
    contractAbi: any[],
    rpcUrl: string,
    privateKey: string,
    onionooBaseUrl: string,
    dryRun: boolean = false
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, contractAbi, this.signer);
    this.onionooClient = new OnionooClient(onionooBaseUrl);
    this.dryRun = dryRun;
  }

  /**
   * Fetch relay data from Onionoo API
   */
  async fetchRelayData(limit: number): Promise<RelayData[]> {
    console.log("\n📡 Step 1: Fetching relay data from Onionoo API\n");

    // Fetch top relays by consensus weight
    const onionooRelays = await this.onionooClient.fetchTopRelays(limit);

    // Transform to contract format
    const relayData = RelayDataTransformer.transformRelays(onionooRelays, {
      filterInvalid: true,
      sortBy: "consensusWeight",
    });

    // Print summary statistics
    const stats = RelayDataTransformer.getSummaryStats(relayData);
    console.log("\n📊 Relay Data Summary:");
    console.log(`   Total relays: ${stats.totalRelays}`);
    console.log(`   Running relays: ${stats.runningRelays}`);
    console.log(
      `   Total bandwidth: ${(stats.totalBandwidth / 1000000000).toFixed(2)} GB/s`
    );
    console.log(`   Average uptime: ${(stats.avgUptime / 10).toFixed(1)}%`);
    console.log(`   Top flags:`, Object.entries(stats.flagCounts).slice(0, 5));
    console.log(
      `   Top countries:`,
      Object.entries(stats.countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    );

    return relayData;
  }

  /**
   * Update contract with relay data in batches
   */
  async updateContract(
    relayData: RelayData[],
    batchSize: number
  ): Promise<UpdateResult[]> {
    console.log("\n🔗 Step 2: Updating smart contract\n");

    if (this.dryRun) {
      console.log("🧪 DRY RUN MODE - No transactions will be sent\n");
    }

    // Check authorization
    const owner = await this.contract.owner();
    const signerAddress = await this.signer.getAddress();
    const isAuthorized = await this.contract.authorizedUpdaters(signerAddress);

    console.log(`📝 Contract owner: ${owner}`);
    console.log(`👤 Updater address: ${signerAddress}`);
    console.log(`✅ Is authorized: ${isAuthorized || signerAddress === owner}\n`);

    if (!isAuthorized && signerAddress !== owner) {
      throw new Error(
        "❌ Signer is not authorized to update the contract. Please add this address as an authorized updater."
      );
    }

    // Batch the relays
    const batches = RelayDataTransformer.batchRelays(relayData, batchSize);
    const results: UpdateResult[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `📦 Processing batch ${i + 1}/${batches.length} (${batch.length} relays)...`
      );

      if (this.dryRun) {
        console.log(
          `   Would update ${batch.length} relays (fingerprints: ${batch
            .slice(0, 3)
            .map((r) => r.fingerprint.slice(0, 8))
            .join(", ")}...)`
        );
        results.push({
          success: true,
          relaysUpdated: batch.length,
        });
        continue;
      }

      try {
        // Estimate gas
        const gasEstimate = await this.contract.batchUpdateRelays.estimateGas(
          batch
        );
        console.log(`   Estimated gas: ${gasEstimate.toString()}`);

        // Send transaction
        const tx = await this.contract.batchUpdateRelays(batch);
        console.log(`   Transaction sent: ${tx.hash}`);
        console.log(`   Waiting for confirmation...`);

        const receipt = await tx.wait();
        console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}\n`);

        results.push({
          success: true,
          relaysUpdated: batch.length,
          transactionHash: receipt.hash,
          gasUsed: receipt.gasUsed,
        });

        // Delay to avoid nonce issues (especially on fast chains like Base)
        if (i < batches.length - 1) {
          const batchDelay = parseInt(process.env.BATCH_DELAY || "3000");
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      } catch (error: any) {
        console.error(`   ❌ Error updating batch ${i + 1}:`, error.message);

        // Try to extract more details from the error
        if (error.data) {
          console.error(`   Error data:`, error.data);
        }
        if (error.reason) {
          console.error(`   Reason:`, error.reason);
        }

        // Log problematic relays for debugging
        console.log(`   First relay in batch: ${batch[0]?.fingerprint?.slice(0, 16)}... (${batch[0]?.nickname})`);
        console.log(`   Relay lastSeen: ${batch[0]?.lastSeen} (${new Date(batch[0]?.lastSeen * 1000).toISOString()})`);

        // If nonce error, wait a bit longer and the next batch should work
        if (error.message.includes('nonce') || error.message.includes('replacement')) {
          console.log(`   ⏳ Waiting 3 seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        results.push({
          success: false,
          relaysUpdated: 0,
          error: error.message,
        });

        // Continue with next batch - don't stop the entire process
        console.log(`   ⏭️  Continuing with next batch...\n`);
      }
    }

    return results;
  }

  /**
   * Verify contract state after update
   */
  async verifyUpdate(): Promise<void> {
    console.log("\n🔍 Step 3: Verifying contract state\n");

    const relayCount = await this.contract.getRelayCount();
    console.log(`📊 Total relays in contract: ${relayCount.toString()}`);

    // Sample a few relays to verify
    if (relayCount > 0n) {
      const sampleSize = Math.min(3, Number(relayCount));
      console.log(`\n📋 Sample relays (first ${sampleSize}):\n`);

      for (let i = 0; i < sampleSize; i++) {
        const fingerprint = await this.contract.getFingerprintByIndex(i);
        const relay = await this.contract.getRelay(fingerprint);

        console.log(`${i + 1}. ${relay.nickname} (${fingerprint.slice(0, 16)}...)`);
        console.log(`   Flags: ${relay.flags.join(", ")}`);
        console.log(`   Uptime: ${(Number(relay.uptime) / 10).toFixed(1)}%`);
        console.log(`   Bandwidth: ${(Number(relay.bandwidth) / 1000000).toFixed(2)} MB/s`);
        console.log(`   Country: ${relay.country}`);
        console.log(`   Running: ${relay.running}\n`);
      }
    }
  }

  /**
   * Run the complete update process
   */
  async run(maxRelays: number, batchSize: number): Promise<void> {
    try {
      console.log("🚀 Starting Derepute Contract Updater\n");
      console.log("=".repeat(60));

      const startTime = Date.now();

      // Step 1: Fetch relay data
      const relayData = await this.fetchRelayData(maxRelays);

      if (relayData.length === 0) {
        console.log("⚠️  No relay data to update. Exiting.");
        return;
      }

      // Step 2: Update contract
      const results = await this.updateContract(relayData, batchSize);

      // Step 3: Verify update
      if (!this.dryRun) {
        await this.verifyUpdate();
      }

      // Summary
      console.log("\n" + "=".repeat(60));
      console.log("\n✨ Update Summary\n");

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const totalRelaysUpdated = results.reduce(
        (sum, r) => sum + r.relaysUpdated,
        0
      );
      const totalGasUsed = results.reduce(
        (sum, r) => sum + (r.gasUsed || 0n),
        0n
      );

      console.log(`   Batches processed: ${results.length}`);
      console.log(`   Successful: ${successful}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Total relays updated: ${totalRelaysUpdated}`);
      if (!this.dryRun && totalGasUsed > 0n) {
        console.log(`   Total gas used: ${totalGasUsed.toString()}`);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`   Duration: ${duration}s`);

      console.log("\n✅ Update complete!\n");
    } catch (error: any) {
      console.error("\n❌ Update failed:", error.message);
      if (error.stack) {
        console.error("\nStack trace:", error.stack);
      }
      process.exit(1);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  // Load configuration (chain-agnostic)
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const network = process.env.NETWORK || "custom";
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.UPDATER_PRIVATE_KEY;
  const onionooBaseUrl =
    process.env.ONIONOO_BASE_URL || "https://onionoo.torproject.org";
  const maxRelays = parseInt(process.env.MAX_RELAYS_TO_FETCH || "100");
  const batchSize = parseInt(process.env.BATCH_SIZE || "10");
  const dryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";

  // Validate configuration
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env");
  }
  if (!rpcUrl) {
    throw new Error("RPC_URL not set in .env");
  }
  if (!privateKey) {
    throw new Error("UPDATER_PRIVATE_KEY not set in .env");
  }

  // Load contract ABI
  const abiPath = path.join(
    __dirname,
    "../../contracts/deployments/TorReputationStore-abi.json"
  );

  if (!fs.existsSync(abiPath)) {
    throw new Error(
      `Contract ABI not found at ${abiPath}. Please deploy the contract first.`
    );
  }

  const contractAbi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

  // Create and run updater
  const updater = new ContractUpdater(
    contractAddress,
    contractAbi,
    rpcUrl,
    privateKey,
    onionooBaseUrl,
    dryRun
  );

  await updater.run(maxRelays, batchSize);
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { ContractUpdater };
