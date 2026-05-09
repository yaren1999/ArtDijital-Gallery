const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtNFT Kapsamlı Test Süreci", function () {
  let  artNft, owner, artist, user, stranger;

  beforeEach(async function () {
    [owner, artist, user, stranger] = await ethers.getSigners();
    ArtNFT = await ethers.getContractFactory("ArtNFT");
    artNft = await ArtNFT.deploy();
  });

  describe("1. Temel Ayarlar ve Telif", function () {
    it("İsim ve Sembol doğru mu?", async () => {
      expect(await artNft.name()).to.equal("Art Digital Gallery");
    });
    
    it("Telif payı (Royalty) %5 olarak doğru hesaplanmalı", async function () {
      const [receiver, amount] = await artNft.royaltyInfo(0, ethers.parseUnits("1", "ether"));
      expect(receiver).to.equal(owner.address);
      expect(amount).to.equal(ethers.parseUnits("0.05", "ether"));
    });
  });

  describe("2. Whitelist ve Güvenlik Yönetimi", function () {
    it("Owner sanatçı ekleyebilmeli", async function () {
      await artNft.addArtist(artist.address);
      expect(await artNft.whitelistedArtists(artist.address)).to.be.true;
    });

    
    it("Owner sanatçıyı whitelist'ten çıkarabilmeli", async function () {
      await artNft.addArtist(artist.address);
      await artNft.removeArtist(artist.address);
      expect(await artNft.whitelistedArtists(artist.address)).to.be.false;
    });

    it("Yabancı biri sanatçı ekleyememeli", async function () {
      await expect(artNft.connect(stranger).addArtist(stranger.address))
        .to.be.revertedWithCustomError(artNft, "OwnableUnauthorizedAccount");
    });
  });

  describe("3. Gelişmiş Mintleme Senaryoları", function () {
    const uri = "ipfs://image-1";

    it("Owner whitelist olmadan da mint yapabilmeli", async function () {
      await artNft.safeMint(owner.address, uri);
      expect(await artNft.ownerOf(0)).to.equal(owner.address);
    });

    it("Onaylı sanatçı mint edebilmeli", async function () {
      await artNft.addArtist(artist.address);
      await artNft.connect(artist).safeMint(artist.address, uri);
      expect(await artNft.ownerOf(0)).to.equal(artist.address);
    });

  
    it("Whitelist'ten çıkarılan sanatçı artık mint yapamamalı", async function () {
      await artNft.addArtist(artist.address);
      await artNft.removeArtist(artist.address);
      await expect(artNft.connect(artist).safeMint(artist.address, uri))
        .to.be.revertedWith("Sadece onayli sanatcilar!");
    });
  });

  describe("4. Enumerable ve Listeleme Gücü", function () {
    beforeEach(async function () {
      await artNft.addArtist(artist.address);
      await artNft.connect(artist).safeMint(artist.address, "uri1");
      await artNft.connect(artist).safeMint(artist.address, "uri2");
    });

    it("Toplam arz (totalSupply) mint sonrası doğru artmalı", async function () {
      expect(await artNft.totalSupply()).to.equal(2);
    });

    
    it("Sanatçının sahip olduğu NFT ID'leri listelenebilmeli", async function () {
      expect(await artNft.tokenOfOwnerByIndex(artist.address, 0)).to.equal(0);
      expect(await artNft.tokenOfOwnerByIndex(artist.address, 1)).to.equal(1);
    });

    it("Global index üzerinden NFT ID'si bulunabilmeli", async function () {
      expect(await artNft.tokenByIndex(1)).to.equal(1);
    });
  });

  describe("5. Transfer ve Yakma", function () {
    it("Kullanıcı NFT'sini transfer edebilmeli", async function () {
      await artNft.addArtist(artist.address);
      await artNft.connect(artist).safeMint(artist.address, "uri");
      await artNft.connect(artist).transferFrom(artist.address, user.address, 0);
      expect(await artNft.ownerOf(0)).to.equal(user.address);
    });
    
    
  });
});