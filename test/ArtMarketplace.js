const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtMarketplace (Pazar Yeri) Testleri", function () {
  let ArtToken, token, ArtNFT, nft, Marketplace, marketplace;
  let owner, artist, buyer;
  const PRICE = ethers.parseUnits("100", 18); 

  beforeEach(async function () {
    [owner, artist, buyer] = await ethers.getSigners();

    ArtToken = await ethers.getContractFactory("ArtToken");
    token = await ArtToken.deploy(ethers.parseUnits("1000000", 18)); 
    const tokenAddress = await token.getAddress();
    
    ArtNFT = await ethers.getContractFactory("ArtNFT");
    nft = await ArtNFT.deploy();
    const nftAddress = await nft.getAddress();

    Marketplace = await ethers.getContractFactory("ArtMarketplace");
    marketplace = await Marketplace.deploy(tokenAddress, nftAddress);

    await token.transfer(buyer.address, ethers.parseUnits("500", 18));
    await nft.addArtist(artist.address);
    await nft.connect(artist).safeMint(artist.address, "ipfs://art");
  });





  describe("Satış ve Royalty Süreci", function () {
    it("Alıcı NFT'yi satın alabilmeli ve royalty sanatçıya gitmeli", async function () {

      await nft.connect(artist).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(artist).listNFT(0, PRICE);
      await token.connect(buyer).approve(await marketplace.getAddress(), PRICE);
      const royaltyReceiverBalanceBefore = await token.balanceOf(owner.address);

      await marketplace.connect(buyer).buyNFT(0);
      expect(await nft.ownerOf(0)).to.equal(buyer.address); 
      const royaltyReceiverBalanceAfter = await token.balanceOf(owner.address);
      expect(royaltyReceiverBalanceAfter).to.be.above(royaltyReceiverBalanceBefore);
    });

    it("Satıcıya (Artist) giden miktar doğru olmalı", async function () {
        await nft.connect(artist).approve(await marketplace.getAddress(), 0);
        await marketplace.connect(artist).listNFT(0, PRICE);
        await token.connect(buyer).approve(await marketplace.getAddress(), PRICE);

        const artistBalanceBefore = await token.balanceOf(artist.address);
        await marketplace.connect(buyer).buyNFT(0);
        const artistBalanceAfter = await token.balanceOf(artist.address);

        expect(artistBalanceAfter).to.be.above(artistBalanceBefore);
    });
  });

  describe("Listeleme iptal etme", function () {
    it("sadece satıcı listeyi silebilir", async function () {
      await nft.connect(artist).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(artist).listNFT(0, PRICE);
      await marketplace.connect(artist).cancelListing(0);
      const listing = await marketplace.listings(0);
      expect(listing.isActive).to.equal(false);
    });

    it("satıcı olmayan Listeyi silemez", async function () {
      await nft.connect(artist).approve(await marketplace.getAddress(),0);
      await marketplace.connect(artist).listNFT(0, PRICE);
      await expect(
        marketplace.connect(buyer).cancelListing(0)
      ).to.be.revertedWith("satici degilsin");
    });
  });

});