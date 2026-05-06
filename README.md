# Art Dijital Gallery — NFT Art Platform

A decentralized digital art gallery built on Ethereum, featuring royalty payments for artists, whitelist-based minting, and ERC20 token payments.

## What Makes This Different?

Unlike basic NFT marketplaces, this project implements:
- **ERC2981 Royalty Standard** — artists earn automatically on every resale
- **Whitelist System** — only approved artists can mint NFTs
- **Artist Protection** — royalties are enforced at the contract level

## Planned Contracts

| Contract | Purpose |
|----------|---------|
| ArtToken (ART) | ERC20 payment token |
| ArtNFT | ERC721 + ERC2981 royalty NFT |
| Whitelist | Artist approval system |
| ArtMarketplace | Royalty-paying marketplace |

## Tech Stack

- **Solidity** ^0.8.24
- **OpenZeppelin** v5 — ERC20, ERC721, ERC2981, Ownable, Pausable
- **Hardhat** — development, testing, deployment
- **Ethers.js** v6 — frontend integration
- **React** — user interface
- **Sepolia** — testnet deployment

## Installation

```bash
git clone https://github.com/username/art-dijital-gallery
cd art-dijital-gallery
npm install
```

## Run Tests

```bash
npx hardhat test
```

## Project Status

🚧 In development

## Author

Yaren — Junior Blockchain Developer  
Isparta / Istanbul, Turkey