import { ethers } from "hardhat";

/**
 * Transfer contract ownership to a new address
 * Usage: CONTRACT_ADDRESS=0x... NEW_OWNER=0x... npm run transfer-ownership
 */
async function main() {
  // Get contract address and new owner from environment variables
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const newOwnerAddress = process.env.NEW_OWNER;

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set. Usage: CONTRACT_ADDRESS=0x... NEW_OWNER=0x... npm run transfer-ownership");
  }

  if (!newOwnerAddress) {
    throw new Error("NEW_OWNER not set. Usage: CONTRACT_ADDRESS=0x... NEW_OWNER=0x... npm run transfer-ownership");
  }

  // Validate addresses
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  if (!ethers.isAddress(newOwnerAddress)) {
    throw new Error(`Invalid new owner address: ${newOwnerAddress}`);
  }

  console.log("🔄 Transferring Contract Ownership\n");
  console.log("=".repeat(60));

  // Get the current signer (old owner)
  const [signer] = await ethers.getSigners();
  const currentOwner = await signer.getAddress();

  console.log(`\n📝 Current owner: ${currentOwner}`);
  console.log(`🎯 New owner:     ${newOwnerAddress}`);
  console.log(`📜 Contract:      ${contractAddress}\n`);

  // Attach to the contract
  const TorReputationStore = await ethers.getContractFactory("TorReputationStore");
  const contract = TorReputationStore.attach(contractAddress);

  // Verify current ownership
  const currentContractOwner = await contract.owner();
  console.log(`✅ Verified contract owner: ${currentContractOwner}\n`);

  if (currentContractOwner.toLowerCase() !== currentOwner.toLowerCase()) {
    throw new Error("Signer is not the current contract owner!");
  }

  // Confirm transfer
  console.log("⚠️  About to transfer ownership...");
  console.log("   This action is irreversible!");
  console.log("   Make sure you have saved the new owner's private key securely.\n");

  // Check balance
  const balance = await ethers.provider.getBalance(currentOwner);
  console.log(`💰 Current owner balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error("Current owner has no ETH for gas fees!");
  }

  // Estimate gas
  console.log("⚙️  Estimating gas...");
  try {
    const gasEstimate = await contract.transferOwnership.estimateGas(newOwnerAddress);
    console.log(`   Estimated gas: ${gasEstimate.toString()}`);

    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    const estimatedCost = gasEstimate * gasPrice;
    console.log(`   Estimated cost: ${ethers.formatEther(estimatedCost)} ETH\n`);

    if (balance < estimatedCost) {
      throw new Error(`Insufficient balance! Need ${ethers.formatEther(estimatedCost)} ETH, have ${ethers.formatEther(balance)} ETH`);
    }
  } catch (error: any) {
    console.error(`   ❌ Gas estimation failed: ${error.message}`);
    console.error(`   This usually means the transaction would revert.\n`);
    throw error;
  }

  // Transfer ownership
  console.log("📤 Sending transaction...");
  try {
    const tx = await contract.transferOwnership(newOwnerAddress, {
      gasLimit: 100000, // Set explicit gas limit
    });
    console.log(`   Transaction hash: ${tx.hash}`);

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}\n`);
  } catch (error: any) {
    console.error(`   ❌ Transaction failed: ${error.message}`);
    if (error.data) {
      console.error(`   Error data: ${error.data}`);
    }
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    throw error;
  }

  // Verify new ownership
  const newContractOwner = await contract.owner();
  console.log(`🎉 Ownership transferred successfully!`);
  console.log(`   New contract owner: ${newContractOwner}\n`);

  console.log("=".repeat(60));
  console.log("\n✨ Next steps:");
  console.log("   1. Update your .env file with the new PRIVATE_KEY");
  console.log("   2. Transfer remaining ETH from old wallet to new wallet");
  console.log("   3. Securely delete the old private key\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
