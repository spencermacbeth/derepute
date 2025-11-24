# Derepute Contracts

Solidity smart contracts for storing Tor relay reputation data on EVM blockchains.

---

## 📋 Overview

The `TorReputationStore` contract provides decentralized storage for Tor network relay metrics. It's designed to be:
- **Gas-efficient** - Optimized storage and batch operations
- **Secure** - Owner-based access control with authorized updaters
- **Chain-agnostic** - Works on any EVM blockchain
- **Upgradeable ownership** - Transfer control for key rotation

---

## 🏗️ Contract Architecture

### TorReputationStore.sol

**Storage Structure:**
```solidity
struct RelayData {
    string fingerprint;      // 40-char hex ID
    string nickname;         // Human-readable name
    string[] flags;          // Reputation flags
    uint256 uptime;          // 0-1000 (0.0% - 100.0%)
    uint256 bandwidth;       // Bytes/sec
    uint256 consensusWeight; // Tor contribution metric
    string country;          // ISO 3166-1 alpha-2
    string asNumber;         // Autonomous System
    uint256 lastSeen;        // Unix timestamp
    bool running;            // Current status
}
```

**Key Functions:**
- `batchUpdateRelays(RelayData[] memory relays)` - Batch upload (gas-efficient)
- `getRelay(string memory fingerprint)` - Get relay by fingerprint
- `getRelaysPaginated(uint256 offset, uint256 limit)` - Paginated retrieval
- `getRelayCount()` - Total relay count
- `transferOwnership(address newOwner)` - Rotate owner for security
- `addAuthorizedUpdater(address updater)` - Authorize update addresses

**Input Validation:**
The contract enforces strict validation on all relay data:
- ✅ Fingerprint must be exactly 40 characters
- ✅ Uptime must be ≤ 1000 (representing 0.0%-100.0%)
- ✅ Country code must be exactly 2 characters (ISO 3166-1 alpha-2)
- ✅ Last seen timestamp cannot be in the future
- ✅ Nickname cannot be empty

**Constants:**
```solidity
uint256 public constant FINGERPRINT_LENGTH = 40;
uint256 public constant MAX_UPTIME = 1000;
uint256 public constant COUNTRY_CODE_LENGTH = 2;
```

---

## 🚀 Deployment

### Prerequisites

- Node.js 20+
- MetaMask wallet with ETH on target chain
- Private key exported from MetaMask

### Quick Deployment

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# Edit .env:
#   PRIVATE_KEY=your_metamask_private_key_without_0x
#   RPC_URL=https://mainnet.base.org
#   CHAIN_ID=8453
#   NETWORK_NAME=base

# 3. Deploy
npm run deploy
```

**Output:**
```
✅ TorReputationStore deployed to: 0x...
👤 Owner: 0x...
🌐 Network: base (chainId: 8453)
```

**Save the contract address** - you'll need it for scripts and web interface.

---

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

### Deployment Wallet
```bash
# Your MetaMask private key (without 0x prefix)
# Get from: MetaMask → Account Details → Show Private Key
# ⚠️ CRITICAL: Keep secret! Delete from .env immediately after deployment!
# ⚠️ NEVER commit .env files to git - automated bots will steal funds within seconds!
# ⚠️ Verify .env is not tracked: git status --ignored
PRIVATE_KEY=your_64_character_hex_key
```

**SECURITY WARNING:** If you accidentally commit your private key to git, it is compromised immediately. Follow the emergency procedure in the main README to rotate keys and remove from git history.

### Chain Configuration (Chain-Agnostic)
```bash
# Network name (can be anything descriptive)
NETWORK_NAME=base

# RPC endpoint for your target chain
# Examples:
#   Ethereum:  https://eth.llamarpc.com
#   Base:      https://mainnet.base.org
#   Polygon:   https://polygon-rpc.com
#   Arbitrum:  https://arb1.arbitrum.io/rpc
RPC_URL=https://mainnet.base.org

# Chain ID for your target chain
# Examples:
#   Ethereum:  1
#   Base:      8453
#   Polygon:   137
#   Arbitrum:  42161
CHAIN_ID=8453
```

### Ownership Transfer (Optional)
```bash
# For rotating private keys
CONTRACT_ADDRESS=0xYourDeployedContract
NEW_OWNER=0xYourNewWalletAddress
```

---

## 🛠️ Available Commands

### Development
```bash
npm run compile              # Compile contracts
npm test                     # Run test suite
npm run deploy:local         # Deploy to local Hardhat node
```

### Deployment
```bash
npm run deploy               # Deploy to configured chain
```

### Security & Management
```bash
npm run generate-wallet      # Generate new secure wallet
npm run transfer-ownership   # Transfer contract ownership
```

**Transfer Ownership Example:**
```bash
# Generate new wallet
npm run generate-wallet
# Save the new address and private key securely

# Transfer ownership
CONTRACT_ADDRESS=0x... NEW_OWNER=0x... npm run transfer-ownership
```

---

## 📁 File Structure

```
contracts/
├── contracts/
│   └── TorReputationStore.sol    # Main contract
├── scripts/
│   ├── deploy.ts                 # Deployment script
│   ├── transferOwnership.ts      # Ownership rotation
│   └── generateWallet.ts         # Wallet generation
├── test/
│   └── TorReputationStore.test.ts # Contract tests
├── hardhat.config.ts              # Chain-agnostic config
└── deployments/                   # Deployment artifacts
    ├── .gitkeep
    ├── TorReputationStore-abi.json
    └── *.json                     # Deployment records
```

---

## 🧪 Testing

Run the full test suite:

```bash
npm test
```

**Test Coverage:**
- Deployment and initialization
- Batch relay updates
- Individual relay retrieval
- Pagination functionality
- Access control (owner/authorized updaters)
- Edge cases and error handling

---

## 💰 Gas Costs

**Deployment:**
- Ethereum: ~0.05-0.15 ETH ($150-450 at 3000 ETH)
- Base: ~0.0001 ETH (~$0.30)
- Polygon: ~0.01 MATIC (~$0.01)

**Batch Upload (5 relays):**
- Ethereum: ~2.5M gas (~$5-15 per batch at 10 gwei)
- Base: ~2.5M gas (~$0.01 per batch)
- Polygon: ~2.5M gas (~$0.05 per batch)

**Optimization:**
- Larger batches use more gas per transaction but fewer total transactions
- L2 chains (Base, Arbitrum) are 10-100x cheaper than Ethereum

---

## 🔐 Security Features

### Access Control
- **Owner** - Can add/remove authorized updaters, transfer ownership
- **Authorized Updaters** - Can update relay data only
- **Public Read** - Anyone can read relay data

### Ownership Transfer
Rotate keys if compromised:

```bash
# 1. Generate new wallet
npm run generate-wallet

# 2. Send small amount of ETH to old wallet (for gas)
# 3. Transfer ownership
CONTRACT_ADDRESS=0xOld NEW_OWNER=0xNew npm run transfer-ownership

# 4. Verify on block explorer
# 5. Delete old private key
```

### Best Practices
- ✅ Delete private key from `.env` after deployment
- ✅ Use separate wallets for deployment vs. updates
- ✅ Monitor contract owner address
- ✅ Regular key rotation for high-value contracts
- ❌ Never commit `.env` files
- ❌ Never reuse compromised keys

---

## 🌐 Multi-Chain Examples

### Ethereum Mainnet
```bash
RPC_URL=https://eth.llamarpc.com
CHAIN_ID=1
NETWORK_NAME=ethereum
npm run deploy
```

### Base Mainnet
```bash
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
NETWORK_NAME=base
npm run deploy
```

### Arbitrum One
```bash
RPC_URL=https://arb1.arbitrum.io/rpc
CHAIN_ID=42161
NETWORK_NAME=arbitrum
npm run deploy
```

### Polygon Mainnet
```bash
RPC_URL=https://polygon-rpc.com
CHAIN_ID=137
NETWORK_NAME=polygon
npm run deploy
```

---

## 📤 Contract Verification (Optional)

To verify on block explorers:

```bash
# Add to .env
BASESCAN_API_KEY=your_basescan_api_key

# Verify (adjust for your chain's explorer)
npx hardhat verify --network custom 0xYourContractAddress
```

Get API keys from:
- **Etherscan**: https://etherscan.io/myapikey
- **Basescan**: https://basescan.org/myapikey
- **Polygonscan**: https://polygonscan.com/myapikey

---

## 🐛 Troubleshooting

**"Out of gas" during deployment**
- Increase `gasLimit` in `scripts/deploy.ts` (currently 5M)
- Check you have enough ETH in wallet

**"Only owner can call this function"**
- Verify wallet address matches contract owner
- Check you're using correct private key

**"RPC URL not set"**
- Ensure `RPC_URL` is in `.env`
- Test RPC with: `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' YOUR_RPC_URL`

**Contract deployed but not responding**
- Verify correct chain with block explorer
- Check contract address is accurate
- Ensure ABI file exists in `deployments/`

---

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Docs](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

---

## 🔗 Related Documentation

- [Main README](../README.md) - Project overview
- [Scripts README](../scripts/README.md) - Data upload tools
- [Web README](../web/README.md) - Frontend interface

---

For issues specific to contracts, please include:
- Solidity compiler version (0.8.24)
- Chain being deployed to
- Full error message
- Hardhat configuration

Built with Hardhat 💎
