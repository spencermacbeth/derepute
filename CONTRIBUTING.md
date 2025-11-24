# Contributing to Derepute

Thank you for your interest in contributing to Derepute! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project follows standard open-source collaboration practices. Please be respectful and constructive in all interactions.

**Expected Behavior:**
- Be professional and respectful
- Provide constructive feedback
- Accept constructive criticism gracefully
- Focus on what's best for the project and community

**Unacceptable Behavior:**
- Harassment or discrimination of any kind
- Trolling or insulting comments
- Spam or off-topic content

## How Can I Contribute?

### Types of Contributions

1. **Bug Reports**: Found a bug? Report it!
2. **Feature Requests**: Have an idea? We'd love to hear it!
3. **Code Contributions**: Fix bugs, add features, improve documentation
4. **Documentation**: Improve README, add examples, clarify instructions
5. **Testing**: Write tests, test on different chains, report findings
6. **UI/UX Improvements**: Enhance the frontend design and user experience

### Good First Issues

Look for issues labeled `good-first-issue` - these are great for newcomers to the project.

## Development Setup

### Prerequisites

- Node.js 22+ (LTS version)
- npm or yarn
- Git
- A code editor (VS Code recommended)
- Native currency for testing on testnets

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/derepute.git
   cd derepute
   ```

3. **Set up the upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/derepute.git
   ```

4. **Install dependencies** for all components
   ```bash
   # Smart contracts
   cd contracts
   npm install

   # Data scripts
   cd ../scripts
   npm install

   # Frontend
   cd ../web
   npm install
   ```

5. **Configure environment variables**
   ```bash
   # Copy .env.example files to .env/.env.local
   cp contracts/.env.example contracts/.env
   cp scripts/.env.example scripts/.env
   cp web/.env.example web/.env.local
   ```

6. **Run tests to verify setup**
   ```bash
   # Test smart contracts
   cd contracts
   npm test
   ```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run contract tests
   cd contracts
   npm test

   # Test locally with Hardhat node
   npm run deploy:local

   # Test frontend
   cd ../web
   npm run dev
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```

5. **Keep your branch up to date**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

## Project Structure

```
derepute/
├── contracts/              # Smart contracts
│   ├── contracts/         # Solidity source files
│   ├── scripts/           # Deployment scripts
│   ├── test/              # Contract tests
│   └── hardhat.config.ts  # Hardhat configuration
│
├── scripts/               # Data fetching and updating
│   ├── src/              # TypeScript source files
│   └── data/             # Cached relay data
│
└── web/                  # Next.js frontend
    ├── app/              # Next.js 16 app directory
    ├── components/       # React components (future)
    ├── hooks/            # Custom React hooks
    └── lib/              # Utility functions and configs
```

## Coding Standards

### General Guidelines

- Write clear, self-documenting code
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Avoid code duplication

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code formatting (tabs/spaces, quotes, etc.)
- Use modern ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks

**Example:**
```typescript
// Good
const calculateUptime = (relay: RelayData): number => {
  return (Number(relay.uptime) / 10).toFixed(1)
}

// Avoid
function calculateUptime(relay) {
  var result = relay.uptime / 10
  return result.toFixed(1)
}
```

### Solidity

- Follow Solidity style guide: https://docs.soliditylang.org/en/latest/style-guide.html
- Use explicit visibility modifiers
- Add NatSpec comments for public functions
- Use events for important state changes
- Follow checks-effects-interactions pattern

**Example:**
```solidity
/// @notice Updates relay data in batch
/// @param relays Array of relay data to update
/// @dev Only authorized updaters can call this function
function batchUpdateRelays(RelayData[] calldata relays) external onlyUpdater {
    require(relays.length > 0, "Empty batch");

    for (uint i = 0; i < relays.length; i++) {
        _updateRelay(relays[i]);
    }

    emit RelaysBatchUpdated(relays.length, msg.sender);
}
```

### React/Next.js

- Use functional components with hooks
- Prefer client components only when needed (Next.js 16)
- Use TypeScript for all components
- Keep components focused and reusable
- Use descriptive prop names

**Example:**
```typescript
interface RelayCardProps {
  relay: RelayData
  showDetails?: boolean
}

export function RelayCard({ relay, showDetails = false }: RelayCardProps) {
  return (
    <div className="cyber-card">
      {/* component content */}
    </div>
  )
}
```

## Testing Guidelines

### Smart Contract Tests

- Write comprehensive tests for all contract functions
- Test both success and failure cases
- Test access control and permissions
- Test edge cases and boundary conditions
- Aim for high code coverage

**Example:**
```typescript
describe("TorReputationStore", () => {
  it("should allow owner to add updater", async () => {
    await contract.addUpdater(updaterAddress)
    expect(await contract.isUpdater(updaterAddress)).to.be.true
  })

  it("should revert when non-owner tries to add updater", async () => {
    await expect(
      contract.connect(otherAccount).addUpdater(updaterAddress)
    ).to.be.revertedWith("Ownable: caller is not the owner")
  })
})
```

### Manual Testing

Before submitting a PR, test your changes:

1. **Local deployment test**
   ```bash
   # Start local Hardhat node
   cd contracts
   npx hardhat node

   # Deploy contract (in another terminal)
   npm run deploy:local

   # Upload test data
   cd ../scripts
   npm run update:localhost

   # Run frontend
   cd ../web
   npm run dev
   ```

2. **Testnet deployment** (for significant changes)
   - Deploy to Base Sepolia or another testnet
   - Upload sample data
   - Verify frontend displays correctly

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] Tests pass locally (`npm test`)
- [ ] New code has corresponding tests
- [ ] Documentation is updated (README, comments, etc.)
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List key changes
- Include any important details

## Testing
- Describe how you tested these changes
- Include any relevant test results

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #issue_number
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Celebrate your contribution!

### Commit Message Guidelines

Use clear, descriptive commit messages:

```bash
# Good
git commit -m "Add pagination support to relay list"
git commit -m "Fix uptime calculation in RelayCard component"
git commit -m "Update deployment docs for multi-chain support"

# Avoid
git commit -m "fix bug"
git commit -m "update"
git commit -m "wip"
```

## Reporting Bugs

### Before Reporting

1. Check if the bug has already been reported in Issues
2. Try to reproduce the bug on the latest version
3. Gather relevant information (error messages, logs, etc.)

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node version: [e.g., 22.0.0]
- Chain: [e.g., Base Sepolia]
- Browser: [e.g., Chrome 120]

**Additional Context**
Any other relevant information, logs, screenshots
```

## Suggesting Features

We welcome feature suggestions! Please provide:

1. **Clear description** of the feature
2. **Use case**: Why is this feature needed?
3. **Proposed solution**: How might it work?
4. **Alternatives considered**: Other approaches you've thought about
5. **Impact**: Who benefits from this feature?

### Feature Request Template

```markdown
**Feature Description**
Clear, concise description of the feature

**Problem it Solves**
What problem does this address?

**Proposed Solution**
How would this feature work?

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Mockups, examples, references
```

## Chain-Agnostic Contributions

When contributing features, keep the chain-agnostic nature of Derepute in mind:

- Don't hardcode chain IDs or contract addresses
- Use environment variables for chain-specific configuration
- Test on multiple chains when possible
- Update documentation to reflect multi-chain support
- Avoid chain-specific dependencies

## Questions?

If you have questions about contributing:

1. Check existing Issues and Discussions
2. Review the README.md and documentation
3. Open a new Discussion or Issue
4. Be specific about what you need help with

## License

By contributing to Derepute, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Derepute! Your efforts help make decentralized Tor reputation data accessible to everyone.
