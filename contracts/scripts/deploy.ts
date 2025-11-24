import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying TorReputationStore contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const TorReputationStore = await ethers.getContractFactory("TorReputationStore");
  const contract = await TorReputationStore.deploy({
    gasLimit: 5000000, // 5M gas limit for deployment
  });

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ TorReputationStore deployed to:", contractAddress);
  console.log("👤 Owner:", await contract.owner());

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(chainId: ${network.chainId})\n`);

  // Save deployment information
  const deployment = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: contractAddress,
    owner: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${network.name}-${network.chainId}.json`;
  const filepath = path.join(deploymentsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  console.log("💾 Deployment info saved to:", filepath);

  // Save ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/TorReputationStore.sol/TorReputationStore.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abiPath = path.join(deploymentsDir, "TorReputationStore-abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("📄 ABI saved to:", abiPath);

  // If not on local network, provide verification instructions
  if (network.chainId !== 31337n && network.chainId !== 1337n) {
    console.log("\n📋 To verify the contract on BaseScan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${contractAddress}`);
  }

  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
