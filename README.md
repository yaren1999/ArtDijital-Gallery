# Art Dijital Gallery — NFT Art Platform

A decentralized digital art ecosystem built on Ethereum that enables artists to create collections, mint NFTs, trade digital assets, and receive automated royalty payments through secure smart contracts.
this project implements a complete NFT lifecycle including collection management, whitelist-based creation, fixed-price sales, offer systems, and auction mechanisms.

## What Makes This Different?
Unlike basic NFT marketplaces, this project implements:

- **ERC2981 Royalty Standard** — artists earn automatically on every resale
- **Collection System** — artists organize NFTs into named collections
- **Auction System** — time-based bidding with automatic refunds
- **Offer System** — buyers can make offers on any NFT
- **Batch Minting** — mint multiple NFTs in a single transaction
- **Whitelist System** — only approved artists can mint
- **Marketplace Fee** — 2% platform fee on every sale
- **Artist Protection** — royalties enforced at contract level

## Live Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| ArtToken (ART) | 0x4f3eA4B0710126e179201bf62dd8E542d130F71C |
| ArtNFT | 0x71133852F8045B236d2C0fB287C8b96efAa10f3C |
| ArtMarketplace | 0xC3fc1A352a61D3DEee323d9AA5E94861DEd8AeC8 |

All contracts verified on [Sepolia Etherscan](https://sepolia.etherscan.io).

## Test Coverage
| ArtToken | 17 |
| ArtNFT (Collection + Mint) | 37 | 
| ArtMarketplace (Listing + Offer + Auction) | 67 |
- **Total: 121 tests** (%100 passing)


## How It Works

Artist gets whitelisted → Creates a Collection → Mints NFTs
↓
Lists NFT or starts Auction
↓
Buyer purchases / places Bid / makes Offer
↓
Royalty → Artist | Fee → Platform | Rest → Seller


1. Artist gets whitelisted by the platform owner.

2. The artist creates one or more NFT collections.

3. NFTs are minted into a selected collection.

4. NFTs can then be:
   • Listed for fixed-price sales
   • Offered by buyers
   • Auctioned through time-based bidding

5. During every successful sale:
   • Royalty is automatically sent to the original artist (ERC2981)
   • Marketplace fee is collected by the platform
   • Remaining payment is transferred to the seller

## Tech Stack

- **Solidity** ^0.8.24
- **OpenZeppelin** v5 — ERC20, ERC721, ERC2981, ERC721Enumerable, Ownable
- **Hardhat** — development, testing, deployment
- **Ethers.js** v6 — frontend integration
- **React** — user interface
- **Sepolia** — testnet deployment


### ArtToken.sol
ERC20 payment token (ART) used across the platform. Supports owner-controlled minting, token burning, and emergency pause to protect the ecosystem.

**Features:**
- `listNFT` — List NFT at fixed price
- `buyNFT` — Purchase with royalty + fee distribution
- `cancelListing / updatePrice` — Listing management
- `makeOffer / cancelOffer / acceptOffer` — Offer system
- `createAuction / placeBid / endAuction` — Auction system
- `withdrawFees` — Owner withdraws platform fees
- `setFeePercent` — Adjustable platform fee (max 10%)
- ReentrancyGuard on all financial functions

### ArtNFT.sol
Full-featured NFT trading platform with auction and offer systems.

**Features:**
- `safeMint` — Mint NFTs into a specific collection
- `batchMint` — Mint multiple NFTs in a single transaction
- `createCollection` — Create NFT collections
- `updateCollection` — Update collection metadata
- `deactivateCollection` — Deactivate collections
- `getCollection` — Read collection information
- `addArtist / removeArtist` — Owner manages the artist whitelist
- `burn` — NFT holders can burn their NFTs
- ERC2981 — Automatic royalty payments (5%)
- ERC721Enumerable — Enumerate all NFTs
- ERC721URIStorage — Store NFT metadata URIs

Supports collection management, whitelist-based minting, batch minting, ERC2981 royalty support, and secure NFT ownership built on OpenZeppelin standards.

### ArtMarketplace.sol
NFT trading platform with automatic royalty distribution. On every sale: artist receives royalty, platform takes 2% fee, seller gets the rest.


**Features:**
- `listNFT` — List NFTs for fixed-price sales
- `buyNFT` — Purchase NFTs with automatic royalty and fee distribution
- `cancelListing` — Cancel active listings
- `updatePrice` — Update listing price

- `makeOffer` — Make purchase offers
- `cancelOffer` — Cancel active offers
- `acceptOffer` — Accept buyer offers

- `createAuction` — Start NFT auctions
- `placeBid` — Place bids
- `endAuction` — Finalize auctions

- `getAuction` — Read auction information

- `withdrawFees` — Withdraw accumulated marketplace fees
- `setFeePercent` — Update marketplace fee (max 10%)


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