import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { RelayData } from "./types";

dotenv.config();

async function main() {
  console.log("🚀 Uploading cached relay data to Base mainnet\n");

  // Load environment variables
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.BASE_RPC_URL;
  const privateKey = process.env.UPDATER_PRIVATE_KEY;
  const batchSize = parseInt(process.env.BATCH_SIZE || "5");

  if (!contractAddress || !rpcUrl || !privateKey) {
    throw new Error("Missing required environment variables");
  }

  // Load ABI
  const abiPath = path.join(process.cwd(), "../contracts/deployments/TorReputationStore-abi.json");
  const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

  // Setup provider and contract
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, signer);

  console.log("📝 Contract:", contractAddress);
  console.log("👤 Updater:", signer.address);

  // Load cached relay data
  const dataPath = path.join(process.cwd(), "data/transformed-relays.json");
  const relayData: RelayData[] = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  console.log(`📊 Loaded ${relayData.length} relays from cache\n`);

  // Create batches
  const batches: RelayData[][] = [];
  for (let i = 0; i < relayData.length; i += batchSize) {
    batches.push(relayData.slice(i, i + batchSize));
  }

  console.log(`📦 Created ${batches.length} batches of ${batchSize} relays\n`);

  // Upload each batch
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} relays)...`);

    try {
      const tx = await contract.batchUpdateRelays(batch);
      console.log(`   Transaction sent: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`   ✅ Batch ${i + 1} confirmed! Gas used: ${receipt.gasUsed.toString()}\n`);
      successCount += batch.length;

      // Wait a bit between transactions
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
      failCount += batch.length;
    }
  }

  console.log("\n============================================================");
  console.log("📊 Upload Complete");
  console.log(`   ✅ Success: ${successCount} relays`);
  console.log(`   ❌ Failed: ${failCount} relays`);
  console.log("============================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Upload failed:", error);
    process.exit(1);
  });
