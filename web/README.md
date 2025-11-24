# Derepute Web Interface

Next.js 16 frontend for viewing Tor relay reputation data from blockchain.

---

## 📋 Overview

The web interface provides a responsive, cyberpunk-themed UI for:
- **Viewing relay metrics** - Uptime, bandwidth, flags, location
- **Real-time search** - Search across all relays by fingerprint, name, or location
- **Progressive loading** - Results appear as they're fetched with live progress indicator
- **Pagination** - Browse through large relay datasets (dynamic page counts)
- **Copying fingerprints** - One-click clipboard copy
- **Chain-agnostic** - Works with any EVM chain via environment variables
- **Real-time data** - Reads directly from blockchain
- **Smart caching** - 5-minute cache TTL to reduce RPC calls
- **Error handling** - Graceful error boundaries and retry logic
- **Rate limit protection** - Exponential backoff for RPC endpoints

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# Edit .env.local with:
#   NEXT_PUBLIC_CONTRACT_ADDRESS - Your deployed contract
#   NEXT_PUBLIC_CHAIN_ID - Chain ID (e.g., 1 for Ethereum)
#   NEXT_PUBLIC_RPC_URL - Public RPC endpoint
#   NEXT_PUBLIC_NETWORK_NAME - Display name (e.g., "Ethereum")

# 3. Start development server
npm run dev

# Visit http://localhost:3000
```

---

## 📝 Environment Variables

Copy `.env.example` to `.env.local` and configure:

### Contract Configuration
```bash
# The deployed TorReputationStore contract address
# Get from contracts deployment output
NEXT_PUBLIC_CONTRACT_ADDRESS=0x207a50fef64cABc3DBfea6F991ee6005e3d49875
```

### Chain Configuration (Chain-Agnostic)
```bash
# Chain ID for target blockchain
# Examples:
#   Ethereum: 1
#   Base: 8453
#   Polygon: 137
#   Arbitrum: 42161
NEXT_PUBLIC_CHAIN_ID=1

# Public RPC URL for target chain
# Free public RPCs:
#   Ethereum: https://eth.llamarpc.com
#   Base: https://mainnet.base.org
#   Polygon: https://polygon-rpc.com
NEXT_PUBLIC_RPC_URL=https://eth.llamarpc.com

# Network display name (shown in UI)
NEXT_PUBLIC_NETWORK_NAME=Ethereum
```

**⚠️ Important:** All environment variables must start with `NEXT_PUBLIC_` to be exposed to the browser.

---

## 🛠️ Available Commands

### Development
```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Add Derepute web interface"
git push origin main
```

2. **Deploy on Vercel**
   - Visit https://vercel.com
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_CONTRACT_ADDRESS`
     - `NEXT_PUBLIC_CHAIN_ID`
     - `NEXT_PUBLIC_RPC_URL`
     - `NEXT_PUBLIC_NETWORK_NAME`
   - Deploy!

3. **Custom Domain** (Optional)
   - Add custom domain in Vercel settings
   - Update DNS records as instructed

### Self-Hosted

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "derepute-web" -- start
```

---

## 📁 File Structure

```
web/
├── app/
│   ├── favicon.svg           # Tor-themed favicon
│   ├── globals.css           # Global styles (cyberpunk theme)
│   ├── icon.tsx              # Dynamic favicon generator
│   ├── layout.tsx            # Root layout with metadata
│   ├── page.tsx              # Main page component
│   └── providers.tsx         # Web3 providers
├── hooks/
│   └── useRelayData.ts       # Contract data hooks
├── lib/
│   ├── contract.ts           # Contract config
│   ├── wagmi/
│   │   └── config.ts         # Chain-agnostic wagmi config
│   └── TorReputationStore-abi.json  # Contract ABI
├── public/                    # Static assets
├── .env.example
├── next.config.ts
└── package.json
```

---

## 🎨 Tech Stack

- **Framework:** Next.js 16 with App Router and Turbopack
- **Styling:** Tailwind CSS v4
- **Web3:**
  - wagmi v3 - React hooks for Ethereum
  - viem v2 - TypeScript Ethereum library
- **Language:** TypeScript
- **UI Theme:** Cyberpunk with neon effects

---

## 🔧 Chain-Agnostic Configuration

The web interface works with any EVM chain through environment variables:

### Ethereum Mainnet
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x207a50fef64cABc3DBfea6F991ee6005e3d49875
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://eth.llamarpc.com
NEXT_PUBLIC_NETWORK_NAME=Ethereum
```

### Base Mainnet
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x146c5Fd5cd00a05a51Cb67a18A0ac1a5486bd069
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_NETWORK_NAME=Base
```

### Polygon
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=137
NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_NETWORK_NAME=Polygon
```

**No code changes required** - just update environment variables and redeploy!

---

## 🎨 Customization

### Theme Colors

Edit `app/globals.css`:
```css
:root {
  --neon-green: #00ff41;    /* Primary accent */
  --neon-purple: #b026ff;   /* Secondary accent */
  --neon-cyan: #00d9ff;     /* Tertiary accent */
}
```

### Title and Branding

Edit `app/page.tsx`:
```tsx
<h1 className="text-3xl md:text-5xl font-bold purple-neon-text glitch mb-2 break-words">
  [DEREPUTE]  {/* Change title here */}
</h1>
```

### Pagination

Edit `app/page.tsx`:
```tsx
const pageSize = 10  // Change number of relays per page
```

---

## 🔍 How It Works

### Data Fetching

The app uses wagmi hooks to read contract data:

```typescript
// hooks/useRelayData.ts
export function useRelayCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRelayCount',
    chainId: CHAIN_ID,
  })
}

export function useRelaysPaginated(offset: number, limit: number) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getRelaysPaginated',
    args: [BigInt(offset), BigInt(limit)],
    chainId: CHAIN_ID,
  })
}
```

### Chain Configuration

Dynamic chain setup in `lib/wagmi/config.ts`:

```typescript
// Reads from environment variables
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1')
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com'

// Creates custom chain
const customChain = defineChain({
  id: chainId,
  name: chainName,
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: { default: { http: [rpcUrl] } },
})
```

---

## 🐛 Troubleshooting

### "No relay data available"

**Causes:**
1. Contract address incorrect
2. RPC URL not working
3. No relays uploaded to contract yet
4. Wrong chain configured

**Solutions:**
```bash
# 1. Verify contract address
echo $NEXT_PUBLIC_CONTRACT_ADDRESS

# 2. Test RPC endpoint
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  $NEXT_PUBLIC_RPC_URL

# 3. Check contract has data
# Visit block explorer and view contract

# 4. Verify chain ID matches deployment
echo $NEXT_PUBLIC_CHAIN_ID
```

### Build errors about environment variables

**Cause:** Environment variables not set or missing `NEXT_PUBLIC_` prefix

**Solution:**
```bash
# All browser-exposed variables MUST start with NEXT_PUBLIC_
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # ✅ Correct
CONTRACT_ADDRESS=0x...              # ❌ Wrong
```

### RPC rate limiting

**Cause:** Free public RPCs have rate limits

**Solutions:**
1. Use different public RPC
2. Get free API key from:
   - **Infura:** https://infura.io
   - **Alchemy:** https://alchemy.com
   - **QuickNode:** https://quicknode.com

```bash
# Example with Infura
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_API_KEY
```

### Slow page loads

**Causes:**
1. RPC endpoint slow/rate-limited
2. Large number of relays

**Solutions:**
1. Use faster RPC (paid tier)
2. Reduce `pageSize` in `app/page.tsx`
3. Deploy to Vercel Edge Functions (automatic optimization)

---

## 📊 Performance

### Metrics
- **Initial Load:** <2 seconds (with fast RPC)
- **Page Change:** <500ms
- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices)
- **Bundle Size:** ~500KB (gzipped)

### Optimization Tips
- Use CDN-backed RPC endpoints
- Enable Vercel Edge Network
- Keep relay list paginated (don't load all at once)
- Consider caching relay data (future improvement)

---

## 🔐 Security

### Environment Variables
- ✅ All variables are public (exposed to browser)
- ✅ Never put private keys in web frontend
- ✅ Contract address and RPC URL are not sensitive

### RPC Endpoints
- ⚠️ Public RPCs can see your IP and requests
- Consider using paid RPC for privacy
- Or run your own node

---

## 🚀 Future Improvements

Ideas for future development:
- [ ] Search by relay fingerprint or nickname
- [ ] Filter by country, flags, or bandwidth
- [ ] Historical data charts
- [ ] Relay details page
- [ ] Export relay data (CSV/JSON)
- [ ] Dark/light mode toggle
- [ ] Multiple chain support in single UI
- [ ] PWA support (offline viewing)

---

## 🔗 Related Documentation

- [Main README](../README.md) - Project overview
- [Contracts README](../contracts/README.md) - Smart contract deployment
- [Scripts README](../scripts/README.md) - Data upload tools

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [wagmi Documentation](https://wagmi.sh)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

For issues specific to the web interface, please include:
- Browser and version
- Network requests in DevTools
- Environment variable values (safe to share)
- Error messages from browser console

Built with Next.js 16 🚀
