# Art Dijital Gallery — NFT Art Platform

A decentralized digital art gallery built on Ethereum, featuring royalty payments for artists, whitelist-based minting, and ERC20 token payments.

## What Makes This Different?

Unlike basic NFT marketplaces, this project implements:
- **ERC2981 Royalty Standard** — artists earn automatically on every resale
- **Whitelist System** — only approved artists can mint NFTs
- **ERC721Enumerable** — users can list and browse all their NFTs
- **Marketplace Fee** — 2% platform fee on every sale
- **Artist Protection** — royalties are enforced at the contract level

## Live Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| ArtToken (ART) | 0x4f3eA4B0710126e179201bf62dd8E542d130F71C |
| ArtNFT | 0x71133852F8045B236d2C0fB287C8b96efAa10f3C |
| ArtMarketplace | 0xC3fc1A352a61D3DEee323d9AA5E94861DEd8AeC8 |

All contracts verified on [Sepolia Etherscan](https://sepolia.etherscan.io).

## How It Works

The ArtDigital ecosystem operates through a seamless integration of three smart contracts:

1. **Get Whitelisted**: To maintain high-quality art, only approved creators can mint. The contract owner adds talented artists to the whitelist.
2. **Minting with ART**: Artists mint their unique digital creations as NFTs by using the platform's native currency, **ArtToken (ART)**.
3. **Royalties & Trading**: Once minted, NFTs can be listed on the **ArtMarketplace**. When an NFT is sold:
   - The **Artist** receives an automatic royalty payment (ERC2981).
   - The **Platform** takes a small 2% fee to support the ecosystem.
   - The **Seller** receives the remaining balance instantly.

## Tech Stack

- **Solidity** ^0.8.24
- **OpenZeppelin** v5 — ERC20, ERC721, ERC2981, ERC721Enumerable, Ownable
- **Hardhat** — development, testing, deployment
- **Ethers.js** v6 — frontend integration
- **React** — user interface
- **Sepolia** — testnet deployment

## Smart Contracts

### ArtToken.sol
ERC20 payment token (ART) used across the platform. Features minting, burning, and emergency pause.

### ArtNFT.sol
ERC721 NFT contract with URI storage, ERC2981 royalty standard, ERC721Enumerable for listing, and whitelist-based minting. Only approved artists can mint.

### ArtMarketplace.sol
NFT trading platform with automatic royalty distribution. On every sale: artist receives royalty, platform takes 2% fee, seller gets the rest.

## Test Coverage

- ArtToken: 8 tests
- ArtNFT: 13 tests
- ArtMarketplace: 5 tests
- **Total: 26 tests**

## Installation

```bash
git clone https://github.com/yaren1999/ArtDijital-Gallery
cd ArtDijital-Gallery
npm install
```

## Run Tests

```bash
npx hardhat test
```

## Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

## Project Status

✅ Live on Sepolia Testnet

## Author

Yaren — Junior Blockchain Developer
Isparta / Istanbul, Turkey