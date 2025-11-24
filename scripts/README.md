# Derepute Scripts

TypeScript utilities for fetching Tor relay data from Onionoo API and uploading to blockchain.

---

## 📋 Overview

The scripts package provides automated tools to:
- **Fetch** Tor relay data from Onionoo API
- **Transform** data to contract-compatible format
- **Upload** relay metrics to blockchain in batches
- **Verify** on-chain data integrity

Data is sorted by **consensus weight** (highest first), ensuring the most important relays are uploaded first.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# Edit .env with:
#   CONTRACT_ADDRESS - From contract deployment
#   RPC_URL - Same chain as contract
#   UPDATER_PRIVATE_KEY - Your wallet private key
#   MAX_RELAYS_TO_FETCH - Number of relays (100, 1000, 10000)
#   BATCH_SIZE - Relays per transaction (5-30)
#   BATCH_DELAY - Milliseconds between batches (3000)

# 3. Upload relay data
npm run update
```

---

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

### Contract Configuration
```bash
# Deployed TorReputationStore contract address
# Get from contracts deployment output
CONTRACT_ADDRESS=0x207a50fef64cABc3DBfea6F991ee6005e3d49875

# Network name (for logging only)
NETWORK=ethereum
```

### Chain Configuration (Chain-Agnostic)
```bash
# RPC URL for your target chain
# Must match the chain where contract is deployed
# Examples:
#   Ethereum: https://eth.llamarpc.com or https://ethereum.publicnode.com
#   Base:     https://mainnet.base.org
#   Polygon:  https://polygon-rpc.com
RPC_URL=https://ethereum.publicnode.com
```

### Updater Wallet
```bash
# Private key for wallet authorized to update contract
# This wallet must be contract owner OR authorized updater
# Get from MetaMask: Account Details → Show Private Key
# ⚠️ CRITICAL: Keep secret! Delete from .env immediately after upload!
# ⚠️ NEVER commit .env files to git - automated bots will steal funds within seconds!
# ⚠️ Verify .env is not tracked: git status --ignored
UPDATER_PRIVATE_KEY=your_private_key_without_0x_prefix
```

**SECURITY WARNING:** Private keys in git are compromised within seconds. Use dedicated updater wallets with minimal funds. See main README for key rotation procedures.

### Onionoo API Configuration
```bash
# Tor Onionoo API base URL (usually don't change)
ONIONOO_BASE_URL=https://onionoo.torproject.org

# Maximum number of relays to fetch
# Top N by consensus weight will be selected
# Options: 100, 1000, 10000, etc.
MAX_RELAYS_TO_FETCH=100
```

### Upload Configuration
```bash
# Number of relays per batch transaction
# Larger = fewer transactions but more gas per tx
# Recommended:
#   Ethereum: 5-10
#   Base/L2s: 20-30
BATCH_SIZE=20

# Delay between batches in milliseconds
# Prevents nonce conflicts on fast chains
# Recommended: 3000 (3 seconds)
# Increase to 5000 if seeing nonce errors
BATCH_DELAY=3000

# Set to 'true' to test without sending transactions
# Set to 'false' to actually update contract
DRY_RUN=false
```

---

## 🛠️ Available Commands

### Data Upload
```bash
npm run update              # Fetch and upload to contract
npm run update:dry-run      # Test without sending transactions
```

### Data Fetching
```bash
npm run fetch               # Fetch from Onionoo API only
npm run process             # Process already-downloaded data
```

### Testing & Verification
```bash
npm run test:read           # Read and verify contract data
```

---

## 📊 Usage Examples

### Upload 100 Relays to Ethereum
```bash
# .env configuration
CONTRACT_ADDRESS=0x207a50fef64cABc3DBfea6F991ee6005e3d49875
RPC_URL=https://ethereum.publicnode.com
UPDATER_PRIVATE_KEY=your_key
MAX_RELAYS_TO_FETCH=100
BATCH_SIZE=5
BATCH_DELAY=3000

# Run upload
npm run update
```

**Expected Output:**
```
🚀 Starting Derepute Contract Updater
============================================================

📡 Step 1: Fetching relay data from Onionoo API
🔝 Fetching top 100 relays by consensus weight...
✅ Fetched 100 relays from Onionoo
✅ Successfully transformed 100 relays

📊 Relay Data Summary:
   Total relays: 100
   Running relays: 100
   Total bandwidth: 8.61 GB/s
   Average uptime: 4.1%

🔗 Step 2: Updating smart contract
📝 Contract owner: 0x58C...
👤 Updater address: 0x58C...
✅ Is authorized: true

📦 Processing batch 1/20 (5 relays)...
   Estimated gas: 2561626
   Transaction sent: 0x9f58...
   ✅ Transaction confirmed in block 23862239
   Gas used: 2540298
...

✨ Update Summary
   Batches processed: 20
   Successful: 20
   Failed: 0
   Total relays updated: 100
   Total gas used: 50254358
   Duration: 327.40s

✅ Update complete!
```

### Upload 10,000 Relays to Base
```bash
# .env configuration
CONTRACT_ADDRESS=0x146c5Fd5cd00a05a51Cb67a18A0ac1a5486bd069
RPC_URL=https://mainnet.base.org
UPDATER_PRIVATE_KEY=your_key
MAX_RELAYS_TO_FETCH=10000
BATCH_SIZE=20           # Larger batches for L2
BATCH_DELAY=3000

# Run upload
npm run update
```

**Time Estimate:**
- 500 batches × (3 sec upload + 3 sec delay) = ~50 minutes
- Cost: ~$5-10 on Base (much cheaper than Ethereum)

### Dry Run Test
```bash
# Test without spending gas
DRY_RUN=true npm run update

# Or use the npm script
npm run update:dry-run
```

---

## 📁 File Structure

```
scripts/
├── src/
│   ├── clients/
│   │   └── onionoo.ts              # Onionoo API client
│   ├── transformers/
│   │   └── relayData.ts            # Data transformation
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── fetchRelayData.ts           # Fetch from API
│   ├── processDownloadedData.ts    # Process cached data
│   ├── updateContract.ts           # Main upload script
│   ├── testRead.ts                 # Contract verification
│   └── uploadCached.ts             # Upload from cache
├── data/                            # Cached API responses (gitignored)
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🔄 Data Pipeline

### 1. Fetch from Onionoo API
```typescript
// Fetches top N relays by consensus weight
const relays = await onionooClient.fetchTopRelays(limit);
```

**API Endpoint:**
- URL: `https://onionoo.torproject.org/details?limit=N`
- Updates: Hourly
- Sorting: By consensus weight (descending)

### 2. Transform Data
```typescript
// Converts Onionoo format to contract format
const transformed = RelayDataTransformer.transformRelays(relays, {
  filterInvalid: true,
  sortBy: "consensusWeight"
});
```

**Transformations:**
- Validates fingerprints (40 chars hex)
- Calculates uptime (0-1000 scale)
- Extracts bandwidth, flags, location
- Filters invalid/incomplete relays
- **Sorts by consensus weight** (highest first)

### 3. Batch and Upload
```typescript
// Creates batches and uploads sequentially
const batches = RelayDataTransformer.batchRelays(relays, batchSize);

for (const batch of batches) {
  await contract.batchUpdateRelays(batch);
  await delay(BATCH_DELAY); // Prevent nonce conflicts
}
```

---

## 💰 Gas Cost Estimates

### Ethereum Mainnet
```
Contract deployment: ~$150-450
Per batch (5 relays): ~$5-15
100 relays (20 batches): ~$100-300
1000 relays (200 batches): ~$1000-3000
```

### Base L2
```
Contract deployment: ~$0.30
Per batch (20 relays): ~$0.01
100 relays (5 batches): ~$0.05
10,000 relays (500 batches): ~$5
```

**Optimization:**
- Use larger `BATCH_SIZE` on L2s (20-30 vs 5-10)
- Increase batch size until nearing block gas limit (~30M)
- Monitor for nonce errors and adjust `BATCH_DELAY`

---

## 🔐 Security Best Practices

### Private Key Management
```bash
# ✅ Good: Only export when needed
# In MetaMask: Account Details → Show Private Key
# Paste into .env
# Run upload
npm run update
# Delete from .env immediately

# ❌ Bad: Leaving key in .env
# ❌ Bad: Committing .env to git
# ❌ Bad: Using main wallet for updates
```

### Recommended Workflow
1. **Generate dedicated updater wallet** (not your main wallet)
2. **Fund with small amount** (~$10-20 for gas)
3. **Add as authorized updater** on contract
4. **Use only for uploads**, not other transactions
5. **Rotate regularly** (monthly for production)

---

## 🐛 Troubleshooting

### "Nonce has already been used"
**Cause:** Transactions sent too quickly, nonce conflicts

**Solution:**
```bash
# Increase delay between batches
BATCH_DELAY=5000  # 5 seconds instead of 3

# Or reduce batch size temporarily
BATCH_SIZE=10     # Instead of 20
```

### "Replacement fee too low"
**Cause:** Same as nonce error, transaction replaced with higher fee

**Solution:** Same as above, increase `BATCH_DELAY`

### "missing revert data"
**Cause:** RPC endpoint issues or contract would revert

**Solutions:**
1. Try different RPC endpoint
   ```bash
   # Ethereum alternatives:
   RPC_URL=https://ethereum.publicnode.com
   RPC_URL=https://eth.llamarpc.com
   ```
2. Verify contract address is correct
3. Check contract is deployed on expected chain

### "Signer is not authorized"
**Cause:** Wallet not owner or authorized updater

**Solution:**
```bash
# Check current owner
npm run test:read

# If you're owner, you're automatically authorized
# Otherwise, owner must add you:
# (from contracts directory)
# CONTRACT_ADDRESS=0x... UPDATER=0xYourAddress npx hardhat run scripts/addUpdater.ts --network custom
```

### "Out of gas"
**Cause:** Batch too large for block gas limit

**Solution:** Reduce `BATCH_SIZE`
```bash
BATCH_SIZE=5  # Start small
```

### Script hangs after "Waiting for confirmation"
**Cause:** RPC issues or slow network

**Solutions:**
1. Wait longer (Ethereum can take 1-2 minutes per tx)
2. Try different RPC endpoint
3. Check transaction on block explorer
4. Restart script (it will skip already-uploaded relays)

---

## 📊 Data Format

### Onionoo API Response
```json
{
  "fingerprint": "27A06581F1CE22D1BA4D160F6E7C7AABAC176242",
  "nickname": "th4r",
  "running": true,
  "flags": ["Fast", "Guard", "HSDir", "Running", "Stable", "V2Dir", "Valid"],
  "consensus_weight": 230000,
  "measured_bandwidth": 107760000,
  "country": "de",
  "as_number": "AS123",
  "last_seen": "2025-11-23 05:00:00"
}
```

### Contract Format
```solidity
{
  fingerprint: "27A06581F1CE22D1BA4D160F6E7C7AABAC176242",
  nickname: "th4r",
  flags: ["Fast", "Guard", "HSDir", "Running", "Stable", "V2Dir", "Valid"],
  uptime: 58,          // 5.8% (scaled 0-1000)
  bandwidth: 107760000,
  consensusWeight: 230000,
  country: "de",
  asNumber: "AS123",
  lastSeen: 1732341600,  // Unix timestamp
  running: true
}
```

---

## 🔬 Advanced Usage

### Custom Data Processing
```bash
# 1. Fetch data only
npm run fetch

# 2. Manually process/modify data in data/ directory

# 3. Upload processed data
npm run upload
```

### Verify Contract Data
```bash
# Read all relay data from contract
npm run test:read

# Sample output for first few relays
```

### Resume Failed Upload
The script automatically skips relays already on-chain. If upload fails midway, just run again:
```bash
npm run update
# Will skip relays 1-50 if already uploaded
# Continues from relay 51
```

---

## 🔗 Related Documentation

- [Main README](../README.md) - Project overview
- [Contracts README](../contracts/README.md) - Smart contract deployment
- [Web README](../web/README.md) - Frontend interface

---

## 📚 API Documentation

### Onionoo API
- **Docs:** https://metrics.torproject.org/onionoo.html
- **Base URL:** https://onionoo.torproject.org
- **Rate Limits:** ~1 request per second (be respectful)
- **Data Updates:** Hourly

### Key Endpoints
- `/details?limit=N` - Top N relays by consensus weight
- `/summary` - Condensed relay list
- `/bandwidth` - Historical bandwidth data

---

For issues specific to scripts, please include:
- Full error message
- `.env` configuration (redact private keys!)
- RPC endpoint being used
- Chain and contract address
- Output of `npm run test:read`

Built with TypeScript and ethers.js 📜
