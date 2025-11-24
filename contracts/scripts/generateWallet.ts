import { ethers } from "hardhat";

/**
 * Generate a new random wallet for ownership transfer
 */
async function main() {
  console.log("🔐 Generating New Wallet\n");
  console.log("=".repeat(60));

  // Generate random wallet
  const newWallet = ethers.Wallet.createRandom();

  console.log("\n✨ New Wallet Generated:\n");
  console.log(`   Address:     ${newWallet.address}`);
  console.log(`   Private Key: ${newWallet.privateKey}`);
  console.log(`   Mnemonic:    ${newWallet.mnemonic?.phrase}\n`);

  console.log("=".repeat(60));
  console.log("\n⚠️  IMPORTANT: Save these credentials securely!");
  console.log("   - Store the private key in a secure password manager");
  console.log("   - Write down the mnemonic phrase on paper");
  console.log("   - NEVER commit these to git or share them\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
