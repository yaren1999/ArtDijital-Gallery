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
    it("İsim ve Sembol doğru mu?", async function ()  {
      expect(await artNft.name()).to.equal("Art Digital Gallery");
      expect(await artNft.symbol()).to.equal("ARTNFT");
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

    it("Global index üzerinden NFT ID'si bulunabilmeli", async function () {
      expect(await artNft.tokenByIndex(0)).to.equal(0);
    });

    it("Sanatçının sahip olduğu NFT ID'leri listelenebilmeli", async function () {
      expect(await artNft.tokenOfOwnerByIndex(artist.address, 0)).to.equal(0);
      expect(await artNft.tokenOfOwnerByIndex(artist.address, 1)).to.equal(1);
    });

    it("Toplam arz (totalSupply) mint sonrası doğru artmalı", async function () {
      expect(await artNft.totalSupply()).to.equal(2);
    });

   
  });


  describe("5. Transfer ve Yakma", function () {
    beforeEach(async function () {
      await artNft.addArtist(artist.address);
      await artNft.connect(artist).safeMint(artist.address, "uri-burn-test");
    });

    it("Kullanıcı NFT'sini transfer edebilmeli", async function () {
      await artNft.connect(artist).transferFrom(artist.address, user.address, 0);
      expect(await artNft.ownerOf(0)).to.equal(user.address);
    });

    it("NFT sahibi NFT'sini başarıyla yakabilmeli (burn)", async function () {
      await expect(artNft.connect(artist).burn(0)).to.not.be.reverted;
      expect(await artNft.totalSupply()).to.equal(0);
    });

    it("Yakılan bir NFT'nin sahibi sorgulandığında kontrat hata vermeli", async function () {
      await artNft.connect(artist).burn(0);

      await expect(artNft.ownerOf(0))
        .to.be.revertedWithCustomError(artNft, "ERC721NonexistentToken");
    });

    it("Başkasına ait bir NFT'yi yabancı biri yakamamalı", async function () {
      await expect(artNft.connect(stranger).burn(0))
        .to.be.revertedWithCustomError(artNft, "ERC721InsufficientApproval");
    });

  });

  describe("6. Collectin sistemleri testleri", function () {
    beforeEach(async function () {
      await artNft.connect(owner).addArtist(artist.address);
    });

    it("Sanatçı koleksiyon oluşturabilmeli", async function () {
     await artNft.connect(artist).createCollection(
        "Ancient Gods: Mount Olympus", 
        "Olimpos kahramanları için efsanevi kılıçlar, zırhlar, karakterler ve özel skinler.", 
        "ipfs://mount-olympus-cover" 
      );
                
      const collection = await artNft.collections(1);
     expect(collection.name).to.equal("Ancient Gods: Mount Olympus");
     expect(collection.description).to.equal("Olimpos kahramanları için efsanevi kılıçlar, zırhlar, karakterler ve özel skinler.");
     expect(collection.coverURI).to.equal("ipfs://mount-olympus-cover");
     expect(collection.creator).to.equal(artist.address);
     expect(collection.isActive).to.be.true;
     expect(collection.nftCount).to.equal(0);

    });

    it("Collection ID otomatik artmalı", async function () {
     await artNft.connect(artist).createCollection("Koleksiyon 1", "Açıklama 1", "ipfs://1");
     await artNft.connect(artist).createCollection("Koleksiyon 2", "Açıklama 2", "ipfs://2");
            
     const col1 = await artNft.collections(1);
     const col2 = await artNft.collections(2);
            
     expect(col1.id).to.equal(1);
     expect(col2.id).to.equal(2);
    });

    it("createdAt block.timestamp ile doldurulmalı", async function () {
     await artNft.connect(artist).createCollection("Test", "Açıklama", "ipfs://test");
     const collection = await artNft.collections(1);
     expect(collection.createdAt).to.be.above(0);
    });

        
    it("Boş isim reddedilmeli", async function () {
     await expect(
     artNft.connect(artist).createCollection("", "Açıklama", "ipfs://cover")
     ).to.be.revertedWith("isim gerekli");
   });

    it("Boş açıklama reddedilmeli", async function () {
      await expect(
      artNft.connect(artist).createCollection("İsim", "", "ipfs://cover")
      ).to.be.revertedWith("Aciklama gerekli");
    });

    it("Boş coverURI reddedilmeli", async function () {
      await expect(
      artNft.connect(artist).createCollection("İsim", "Acıklama", "")
      ).to.be.revertedWith("Kapak gorseli gerekli");
    });

   it("Whitelist'te olmayan oluşturamamalı", async function () {
     await expect(
     artNft.connect(stranger).createCollection("İsim", "Acıklama", "ipfs://cover")
     ).to.be.revertedWith("Sadece onayli sanatcilar!");
   });

   it("collectionCounter doğru artmalı", async function () {
     expect(await artNft.collectionCounter()).to.equal(0);
            
      await artNft.connect(artist).createCollection("Test", "Acıklama", "ipfs://test");
      expect(await artNft.collectionCounter()).to.equal(1);
            
      await artNft.connect(artist).createCollection("Test2", "Acıklama2", "ipfs://test2");
      expect(await artNft.collectionCounter()).to.equal(2);
    });

  });

});