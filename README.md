# Derepute - Decentralized Tor Reputation Oracle

**Chain-agnostic decentralized oracle system for indexing and storing Tor network relay reputation data on EVM-compatible blockchains.**

Derepute enables on-chain access to verifiable Tor relay metrics including uptime, bandwidth, consensus weight, and reputation flags. The system is fully chain-agnostic, supporting deployment to any EVM blockchain (Ethereum, Base, Polygon, Arbitrum, etc.) through simple environment variable configuration.

---

## 🌟 Features

- **Chain-Agnostic Architecture** - Deploy to any EVM chain by changing environment variables
- **Automated Data Pipeline** - Fetch, transform, and upload Tor relay data from Onionoo API
- **Batch Upload System** - Efficient on-chain storage with configurable batch sizes
- **Real-time Web Interface** - View relay metrics with responsive cyberpunk UI
- **Gas Optimized** - Smart contract and upload strategies optimized for minimal gas costs
- **Top-N Sorting** - Relays uploaded in order of consensus weight (most important first)
- **Input Validation** - Comprehensive validation of relay data (fingerprints, country codes, timestamps)
- **Progressive Search** - Real-time search across all relays with live result updates
- **Error Handling** - Retry logic with exponential backoff for rate limit protection

---

## 🔒 Security & Quality Assurance

Derepute has undergone security hardening and code quality improvements:

- ✅ **Input Validation** - Contract validates fingerprint length, country codes, uptime bounds, and timestamps
- ✅ **Comprehensive Testing** - 30+ unit tests ensuring contract reliability
- ✅ **Rate Limit Protection** - Exponential backoff retry logic for RPC endpoints
- ✅ **Cache Management** - 5-minute TTL on frontend cache to prevent stale data
- ✅ **Error Boundaries** - React error boundaries for graceful failure handling
- ✅ **Security Warnings** - Prominent documentation on private key management
- ✅ **Code Constants** - Magic numbers extracted to named constants for maintainability

---

## 📁 Project Structure

```
derepute/
├── contracts/          # Solidity smart contracts
│   ├── contracts/      # Contract source files
│   ├── scripts/        # Deployment and management scripts
│   └── test/           # Contract tests
├── scripts/            # Data fetching and upload scripts
│   └── src/            # TypeScript source
│       ├── clients/    # Onionoo API client
│       ├── transformers/  # Data transformation
│       └── types/      # TypeScript types
└── web/                # Next.js frontend
    ├── app/            # Next.js 16 app router
    ├── hooks/          # React hooks for contract data
    └── lib/            # Utilities and configurations
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ with npm
- **MetaMask** or similar Web3 wallet
- **ETH/Tokens** on your target chain for gas fees

### 1. Clone and Install

```bash
git clone https://github.com/spencermacbeth/derepute.git
cd derepute

# Install all dependencies
cd contracts && npm install
cd ../scripts && npm install
cd ../web && npm install
```

### 2. Deploy Smart Contract

```bash
cd contracts

# Copy and configure environment
cp .env.example .env
# Edit .env with your:
#   - PRIVATE_KEY (from MetaMask)
#   - RPC_URL (e.g., https://mainnet.base.org)
#   - CHAIN_ID (e.g., 8453 for Base)
#   - NETWORK_NAME (e.g., base)

# Deploy
npm run deploy
# Save the contract address from output
```

### 3. Upload Relay Data

```bash
cd ../scripts

# Configure environment
cp .env.example .env
# Edit .env with:
#   - CONTRACT_ADDRESS (from deployment)
#   - RPC_URL (same as deployment)
#   - UPDATER_PRIVATE_KEY (your wallet private key)
#   - MAX_RELAYS_TO_FETCH (e.g., 100 or 10000)
#   - BATCH_SIZE (5-10 for Ethereum, 20-30 for Base/L2s)

# Upload relays
npm run update
```

### 4. Run Web Interface

```bash
cd ../web

# Configure environment
cp .env.example .env.local
# Edit .env.local with:
#   - NEXT_PUBLIC_CONTRACT_ADDRESS (your contract)
#   - NEXT_PUBLIC_CHAIN_ID (e.g., 8453)
#   - NEXT_PUBLIC_RPC_URL (public RPC endpoint)
#   - NEXT_PUBLIC_NETWORK_NAME (display name)

# Start development server
npm run dev
# Visit http://localhost:3000
```

---

## 📦 Detailed Component Documentation

### Contracts (`/contracts`)

Hardhat-based Solidity smart contracts for storing Tor relay data.

**Key Files:**
- `contracts/TorReputationStore.sol` - Main storage contract
- `scripts/deploy.ts` - Chain-agnostic deployment script
- `scripts/transferOwnership.ts` - Owner rotation for security
- `scripts/generateWallet.ts` - Generate new secure wallets

**Available Commands:**
```bash
npm run compile              # Compile contracts
npm run test                 # Run test suite
npm run deploy               # Deploy to configured chain
npm run generate-wallet      # Generate new wallet
npm run transfer-ownership   # Transfer contract ownership
```

[See contracts/README.md for detailed documentation](./contracts/README.md)

### Scripts (`/scripts`)

TypeScript scripts for fetching Tor relay data and uploading to blockchain.

**Key Features:**
- Fetches top N relays by consensus weight from Onionoo API
- Transforms data to contract-compatible format
- Batch uploads with configurable sizes and delays
- Automatic retry logic for nonce conflicts
- Progress tracking and error reporting

**Available Commands:**
```bash
npm run fetch         # Fetch relay data from Onionoo
npm run process       # Process downloaded data
npm run update        # Fetch and upload to contract
npm run update:dry-run  # Test without sending transactions
npm run test:read     # Test reading from contract
```

[See scripts/README.md for detailed documentation](./scripts/README.md)

### Web Interface (`/web`)

Next.js 16 frontend with Turbopack, wagmi v3, and viem v2.

**Features:**
- Chain-agnostic Web3 integration
- Real-time relay data display
- Pagination and sorting
- Copy-to-clipboard for relay fingerprints
- Responsive mobile design
- Cyberpunk-themed UI

**Available Commands:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
```

[See web/README.md for detailed documentation](./web/README.md)

---

## 🔐 Security Best Practices

### ⚠️ CRITICAL: Never Commit Private Keys

**WARNING**: Private keys committed to git are compromised within seconds by automated bots scanning GitHub. Your funds will be stolen immediately.

- ✅ Use `.env` files (protected by `.gitignore`)
- ✅ **IMMEDIATELY** delete private keys from `.env` after deployment
- ✅ Use MetaMask for most transactions
- ✅ Verify `.env` files are NOT tracked: `git status --ignored`
- ❌ **NEVER** commit `.env` files to git
- ❌ **NEVER** hardcode private keys
- ❌ **NEVER** share `.env` files via chat/email
- ❌ **NEVER** push `.env` files to cloud storage

**If you accidentally commit a private key:**
1. Immediately generate a new wallet
2. Transfer all funds to the new wallet
3. Transfer contract ownership to new wallet
4. Remove the key from git history (see below)
5. Revoke all permissions for the compromised wallet

### Removing Keys from Git History

```bash
# Remove .env from entire git history (DESTRUCTIVE - use with caution)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/.env contracts/.env web/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote (WARNING: rewrites history)
git push origin --force --all
git push origin --force --tags
```

### Rotate Compromised Keys

If a private key is exposed:

```bash
cd contracts
npm run generate-wallet  # Generate new wallet

# Transfer ownership to new wallet
CONTRACT_ADDRESS=0xYourContract NEW_OWNER=0xNewWallet npm run transfer-ownership

# Transfer remaining funds to new wallet
# Delete old private key everywhere
```

### Use Environment Variables

All sensitive configuration uses environment variables:
- Private keys
- RPC URLs (can be paid/private endpoints)
- Contract addresses (public but project-specific)

---

## 🌐 Multi-Chain Deployment

Derepute supports any EVM-compatible chain. Simply change environment variables:

### Example: Ethereum Mainnet

```bash
# contracts/.env
RPC_URL=https://eth.llamarpc.com
CHAIN_ID=1
NETWORK_NAME=ethereum

# Deploy and get contract address
npm run deploy

# Upload data with same config
# Update web/.env.local with Ethereum contract address
```

### Example: Base Mainnet

```bash
# contracts/.env
RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
NETWORK_NAME=base

# Use larger batches for cheaper L2 gas
# scripts/.env
BATCH_SIZE=20
BATCH_DELAY=3000
```

### Example: Polygon

```bash
# contracts/.env
RPC_URL=https://polygon-rpc.com
CHAIN_ID=137
NETWORK_NAME=polygon
```

---

## 💰 Gas Cost Estimates

Costs for uploading 100 relays (20 batches of 5):

| Chain | Gas Price | Total Cost | Time |
|-------|-----------|------------|------|
| **Ethereum** | ~10 gwei | ~$5-15 | 10 min |
| **Base** | ~0.1 gwei | ~$0.50 | 5 min |
| **Arbitrum** | ~0.1 gwei | ~$1-2 | 5 min |
| **Polygon** | ~30 gwei | ~$0.10 | 5 min |

*Costs vary with gas prices. L2s (Base, Arbitrum) are significantly cheaper.*

**Optimization Tips:**
- Use larger `BATCH_SIZE` on L2s (20-30 vs 5-10)
- Reduce `BATCH_DELAY` for faster uploads
- Deploy during low gas price periods

---

## 📊 Data Sources

**Onionoo API** - Official Tor Project relay data source
- Base URL: https://onionoo.torproject.org
- Updates: Every hour
- Metrics: Bandwidth, uptime, consensus weight, flags, location

**Relay Sorting:**
- Primary: Consensus weight (Tor's contribution metric)
- Order: Descending (most important first)
- Benefit: Top-N relays guaranteed in any partial upload

---

## 🛠️ Development

### Local Testing

```bash
# Start local Hardhat node
cd contracts
npx hardhat node

# Deploy to local node (new terminal)
npm run deploy:local

# Upload test data
cd ../scripts
# Configure for localhost:8545, CHAIN_ID=1337
npm run update

# Test web interface
cd ../web
npm run dev
```

### Running Tests

```bash
# Contract tests
cd contracts
npm test

# Data transformation tests (if available)
cd ../scripts
npm test
```

---

## 📝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

**Key Points:**
- Follow existing code style
- Add tests for new features
- Update documentation
- Never commit secrets

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🔗 Links

- **Live Deployments:**
  - Ethereum: `0x207a50fef64cABc3DBfea6F991ee6005e3d49875`
  - Base: `0x146c5Fd5cd00a05a51Cb67a18A0ac1a5486bd069`

- **Tor Project:** https://www.torproject.org
- **Onionoo API:** https://metrics.torproject.org/onionoo.html

---

## 💡 Use Cases

- **Tor Node Selection** - dApps can select relays based on on-chain reputation
- **Reputation Verification** - Trustless verification of relay metrics
- **Network Analysis** - Historical on-chain data for Tor network research
- **Incentive Systems** - Reward high-performing relays with tokens
- **Decentralized VPN** - Select exit nodes based on verified performance

---

## 🐛 Troubleshooting

### Common Issues

**"Nonce has already been used"**
- Increase `BATCH_DELAY` in scripts/.env (try 5000)
- Reduce `BATCH_SIZE` temporarily

**"Out of gas"**
- Increase gas limit in deploy.ts
- Check you have enough ETH

**"No relay data available" in web UI**
- Verify contract address is correct
- Check RPC_URL is working
- Ensure relays were uploaded successfully

**Private key stolen**
- Follow security rotation guide above
- Never reuse compromised keys
- Consider contracts lost if ownership stolen

---

## 📧 Support

For issues, please open a GitHub issue with:
- Component (contracts/scripts/web)
- Chain being used
- Error messages
- Configuration (redact private keys!)

---

Built with ❤️ for the Tor network and Web3 community
