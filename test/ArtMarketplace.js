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


  describe("listNFT", function () {
   it("NFT listelenebilmeli", async function () {
    await nft.connect(artist).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(artist).listNFT(0 , PRICE);
    const listing = await marketplace.listings(0);

    expect(listing.seller).to.equal(artist)
    expect(listing.tokenId).to.equal(0);
    expect(listing.isActive).to.equal(true);
    expect(listing.price).to.equal(PRICE);
   });

   it("NFT sahibi olmayan listeleyemez", async function () {
      await nft.connect(artist).approve(await marketplace.getAddress(), 0);

      await expect(
      marketplace.connect(buyer).listNFT(0, PRICE)
      ).to.be.revertedWith("Bu NFT size ait degil");
    });

    it("Fiyat 0 olamaz", async function () {
      await nft.connect(artist).approve(await marketplace.getAddress(), 0);

      await expect(
      marketplace.connect(artist).listNFT(0, 0)
      ).to.be.revertedWith("Fiyat sifirdan buyuk olmali");

    });

    it("Marketplace yetkisi yoksa listelenemez", async function () {
      await expect(
      marketplace.connect(artist).listNFT(0, PRICE)
      ).to.be.revertedWith("Marketplace yetkilendirilmedi");
    });
  });    


  describe("buyNFT testleri", function () {
  
    beforeEach(async function () {
     await nft.connect(artist).approve(await marketplace.getAddress(), 0);
     await marketplace.connect(artist).listNFT(0, PRICE);
     await token.connect(buyer).approve(await marketplace.getAddress(), PRICE);

    });

    it("Alıcı NFT'nin sahibi olmalı", async function () {
     await marketplace.connect(buyer).buyNFT(0);
     expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("Royalty sanatçıya gitmeli", async function () {
     const before = await token.balanceOf(owner.address);
     await marketplace.connect(buyer).buyNFT(0);
     const after = await token.balanceOf(owner.address);
     expect(after).to.be.above(before);
    });

    it("Satıcıya ödeme gitmeli", async function () {
      const before = await token.balanceOf(artist.address);
      await marketplace.connect(buyer).buyNFT(0);
      const after = await token.balanceOf(artist.address);
      expect(after).to.be.above(before);
    });

  });


  describe("Listeleme iptal etme Testi", function () {
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