const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtMarketplace (Pazar Yeri) Testleri", function () {
  let ArtToken, token, ArtNFT, nft, Marketplace, marketplace;
  let owner, artist, buyer ,stranger; 
  const PRICE = ethers.parseUnits("100", 18); 

  beforeEach(async function () {
    [owner, artist, buyer, stranger] = await ethers.getSigners();

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

    it("NFTlisted event emit edilmeli", async function () {
      await nft.connect(artist).approve(await marketplace.getAddress(), 0);

      await expect(
      marketplace.connect(artist).listNFT(0, PRICE)
      ).to.emit(marketplace, "NFTListed")
      .withArgs(0, artist.address, PRICE);
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

    it("NFT satışta değilse satın alınamaz", async function () {
      await marketplace.connect(buyer).buyNFT(0);
  
      await expect(
      marketplace.connect(buyer).buyNFT(0)
      ).to.be.revertedWith("Bu NFT satista degil");

    });

    it("yetersiz bakiye ile satın alınamaz", async function () {
     const [,,,poorBuyer] = await ethers.getSigners();
  
     await token.connect(poorBuyer).approve(
     await marketplace.getAddress(), PRICE);

     await expect(
     marketplace.connect(poorBuyer).buyNFT(0)
     ).to.be.revertedWith("Yetersiz bakiye");
   
    });

    it("NFTSold event emit edilmeli", async function () {
      await expect(
      marketplace.connect(buyer).buyNFT(0)
      ).to.emit(marketplace, "NFTSold")
      .withArgs(0, buyer.address, PRICE);
    });

  });


  describe("CancelListing Testleri", function () {
  
    beforeEach(async function () {
     await nft.connect(artist).approve(await marketplace.getAddress(), 0);
     await marketplace.connect(artist).listNFT(0, PRICE);
   });

   it("Aktif olmayan veya zaten iptal edilmiş bir ilan tekrar iptal edilemez", async function () {
     await marketplace.connect(artist).cancelListing(0);
    
     await expect(
      marketplace.connect(artist).cancelListing(0)
     ).to.be.revertedWith("Ilan aktif degil"); 
    });


    it("Satıcı ilanını başarıyla iptal edebilmeli ve ilan pasif olmalı", async function () {
     await marketplace.connect(artist).cancelListing(0);
    
     const listing = await marketplace.listings(0);
     expect(listing.isActive).to.equal(false);
    });

    it("Satıcı olmayan listeyi silemez", async function () {
  
      await expect(
      marketplace.connect(buyer).cancelListing(0)
    ).to.be.revertedWith("satici degilsin");
   });

   it("İlan iptal edildiğinde ListingCanceled emit edilmeli", async function () {
    
    await expect(
    marketplace.connect(artist).cancelListing(0) 
    ).to.emit(marketplace, "ListingCanceled")     
    .withArgs(0, artist.address);                
  });

  });

 describe("Fiyat güncelleme (update) testleri", function () {
    const NEW_PRICE = ethers.parseUnits("150", 18); 

    beforeEach(async function () {
      await nft.connect(artist).approve(await marketplace.getAddress(), 0);
      await marketplace.connect(artist).listNFT(0, PRICE);
    });

    
    it("satıcı fiyatı güncelleyebilmeli", async function () {
      const listingBefore = await marketplace.listings(0);
      expect(listingBefore.price).to.equal(PRICE);
      await marketplace.connect(artist).updatePrice(0, NEW_PRICE);

      const listingAfter = await marketplace.listings(0);
      expect(listingAfter.price).to.equal(NEW_PRICE);
    });

    it("satılmış NFT fiyatı güncellenemez", async function () {
      await token.connect(buyer).approve(await marketplace.getAddress(), PRICE);
      await marketplace.connect(buyer).buyNFT(0);
  
      await expect(
      marketplace.connect(artist).updatePrice(0, NEW_PRICE)
      ).to.be.revertedWith("Ilan aktif degil");
    });

   
    it("satıcı olmayan fiyat güncelleyemez", async function () {
      await expect(
         marketplace.connect(buyer).updatePrice(0, NEW_PRICE)
      ).to.be.revertedWith("satici degilsin");
    });

    it("yeni fiyat 0 olarak güncellenemez", async function () {
      await expect(
         marketplace.connect(artist).updatePrice(0, 0)
      ).to.be.revertedWith("gecersiz fiyat");
    });

 });
   
  describe("Fee Yönetimi", function () {
  
  it("Owner komisyon oranını güncelleyebilmeli", async function () {
    await marketplace.setFeePercent(5);
    expect(await marketplace.marketplaceFeePercent()).to.equal(5);
  });

  it("Komisyon %10'dan fazla olamaz", async function () {
    await expect(
      marketplace.setFeePercent(11)
    ).to.be.revertedWith("Komisyon cok yuksek");
  });

  it("Owner olmayan komisyon güncelleyemez", async function () {
    await expect(
      marketplace.connect(buyer).setFeePercent(5)
    ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
  });

  it("Owner biriken komisyonları çekebilmeli", async function () {
    await nft.connect(artist).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(artist).listNFT(0, PRICE);
    await token.connect(buyer).approve(await marketplace.getAddress(), PRICE);
    await marketplace.connect(buyer).buyNFT(0);

    const ownerBefore = await token.balanceOf(owner.address);
    await marketplace.withdrawFees();
    const ownerAfter = await token.balanceOf(owner.address);

    expect(ownerAfter).to.be.above(ownerBefore);
  });

  it("Owner olmayan komisyon çekemez", async function () {
    await expect(
      marketplace.connect(buyer).withdrawFees()
    ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
  });

  
 });

  describe("Offer System (makeOffer)", function () {
  const OFFER_AMOUNT = ethers.parseUnits("50", 18);

  beforeEach(async function () {
    await nft.connect(artist).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(artist).listNFT(0, PRICE);

    await token.connect(buyer).approve(await marketplace.getAddress(), OFFER_AMOUNT);
  });

  it("Teklif oluşturabilmeli", async function () {
    await marketplace.connect(buyer).makeOffer(0, OFFER_AMOUNT);

    const offer = await marketplace.offers(0, 0);

    expect(offer.buyer).to.equal(buyer.address);
    expect(offer.amount).to.equal(OFFER_AMOUNT);
    expect(offer.isActive).to.equal(true);
  });

  it("Teklif 0 olamaz", async function () {
    await expect(
      marketplace.connect(buyer).makeOffer(0, 0)
    ).to.be.revertedWith("Teklif sifirdan buyuk olmali");
  });

  it("Kendi NFT'sine teklif veremez", async function () {
    await token.transfer(artist.address, OFFER_AMOUNT);
    await token.connect(artist).approve(await marketplace.getAddress(), OFFER_AMOUNT);

    await expect(
      marketplace.connect(artist).makeOffer(0, OFFER_AMOUNT)
    ).to.be.revertedWith("Kendi NFT'nize teklif veremezsiniz");
  });

  it("Yetersiz bakiye ile teklif verilemez", async function () {
    const [, , , poorBuyer] = await ethers.getSigners();

    await expect(
      marketplace.connect(poorBuyer).makeOffer(0, OFFER_AMOUNT)
    ).to.be.revertedWith("Yetersiz bakiye");
  });

  it("Yetersiz harcama izni (allowance) ile teklif verilemez", async function () {
    const [, , , userWithoutAllowance] = await ethers.getSigners();

    await token.transfer(userWithoutAllowance.address, OFFER_AMOUNT);
    await token.connect(userWithoutAllowance).approve(await marketplace.getAddress(), 0);

    await expect(
      marketplace.connect(userWithoutAllowance).makeOffer(0, OFFER_AMOUNT)
    ).to.be.revertedWith("Kontrata harcama izni (allowance) vermediniz!");
  });

  it("createdAt doğru oluşmalı", async function () {
    await marketplace.connect(buyer).makeOffer(0, OFFER_AMOUNT);

    const offer = await marketplace.offers(0, 0);

    expect(offer.createdAt).to.be.gt(0);
  });

  it("isActive true başlamalı", async function () {
    await marketplace.connect(buyer).makeOffer(0, OFFER_AMOUNT);

    const offer = await marketplace.offers(0, 0);

    expect(offer.isActive).to.equal(true);
  });

  it("Aynı NFT'ye birden fazla teklif verilebilmeli", async function () {
    const [, , , user2] = await ethers.getSigners();

    await token.transfer(user2.address, ethers.parseUnits("100", 18));
    await token.connect(user2).approve(await marketplace.getAddress(), OFFER_AMOUNT);

    await marketplace.connect(buyer).makeOffer(0, OFFER_AMOUNT);
    await marketplace.connect(user2).makeOffer(0, OFFER_AMOUNT);

    const offer1 = await marketplace.offers(0, 0);
    const offer2 = await marketplace.offers(0, 1);

    expect(offer1.buyer).to.equal(buyer.address);
    expect(offer2.buyer).to.equal(user2.address);
  });
 });

  describe("cancelOffer Testleri", function() {

    beforeEach (async function () {
        await nft.connect(artist).approve(await marketplace.getAddress(), 0);
        await marketplace.connect(artist).listNFT(0, PRICE);
        await token.connect(buyer).approve(await marketplace.getAddress() , PRICE);
        await marketplace.connect(buyer).makeOffer(0, PRICE);

    });

     
    it("yabancı birisi iptal edememeli", async function () {
      await expect(
        marketplace.connect(stranger).cancelOffer(0,0)
      ).to.be.revertedWith("Bu teklif size ait degil!");
    });

    it("Bu teklif , size ait degil", async function () {
       await expect(
       marketplace.connect(stranger).cancelOffer(0,0)
      ).to.be.revertedWith("Bu teklif size ait degil!")
    });

    it("teklif sahibi iptal edebilmeli", async function () {
      await marketplace.connect(buyer).cancelOffer(0,0);
      const offer = await marketplace.offers(0,0);
      expect(offer.isActive).to.equal(false);
    });

    it("Gecersiz teklif", async function () {
       await expect(
        marketplace.connect(buyer).cancelOffer(0,1)
      ).to.be.revertedWith("Gecersiz teklif!");
    });

    it("2 kere iptal edemez", async function () {
      await marketplace.connect(buyer).cancelOffer(0,0);
  
      await expect(
        marketplace.connect(buyer).cancelOffer(0,0)
      ).to.be.revertedWith("Teklif aktif degil!");
    });

  });

  describe("acceptOffer Testleri", function () {

   beforeEach(async function () {
    await nft.connect(artist).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(artist).listNFT(0, PRICE);
    await token.connect(buyer).approve(await marketplace.getAddress(), PRICE);
    await marketplace.connect(buyer).makeOffer(0,PRICE);
   });

   it("2 KERE TEKLİFİ KABUL EDEMEZSİNİZ!", async function(){
    await marketplace.connect(artist).acceptOffer(0,0);
    await expect(
      marketplace.connect(artist).acceptOffer(0,0)
    ).to.be.revertedWith("Teklif aktif degil!");
   });

   it("NFT sahibi teklifi kabul edebilmeli", async function() {
    await marketplace.connect(artist).acceptOffer(0,0);
    const acceptOffer = await marketplace.offers(0,0);
    expect(acceptOffer.isActive).to.equal(false);
   });

   it("NFT Sahibi olmayan teklifi kabul edememeli!", async function () {
     await expect(
      marketplace.connect(stranger).acceptOffer(0,0)
     ).to.be.revertedWith("Sadece NFT sahibi kabul edebilir!")
   });

   it("Geçersiz teklif kabul edilemez!",async function () {
    await expect(
      marketplace.connect(stranger).acceptOffer(0 , 999)
    ).to.be.revertedWith("Gecersiz teklif!");
   });

   it("Kabul sonrası NFT alıcıya geçmeli", async function () {
     await marketplace.connect(artist).acceptOffer(0,0);

      expect(
         await nft.ownerOf(0)
      ).to.equal(await buyer.getAddress());
   });
 });

   describe("createAuction Testleri", async function () {
    const accept_NFT = ethers.parseUnits("50", 18);

   it("NFT sahibi olmayan açık arttırmaya koyamamalı", async function () {
    await expect(marketplace.connect(stranger).createAuction(0, 50, 86400)
     ).to.be.revertedWith("NFT size ait degil!");
   });

   it("minimum  teklif sifirdan büyük olmalı", async function() {
     await expect(
      marketplace.connect(artist).createAuction(0, 0, 86400)
     ).to.be.revertedWith( "Minimum teklif sifirdan buyuk olmali");
   });

  it("Verilen süre sifirdan büyük olmalı", async function () {
      await expect(
        marketplace.connect(artist).createAuction(0, 50, 0)
    ).to.be.revertedWith("Sure sifirdan buyuk olmali");
  });

   it("Aynı NFT başka yerde açık arttırmada olamaz!", async function() {
      await marketplace.connect(artist).createAuction(0, 50, 86400);

      await expect(marketplace.connect(artist).createAuction(0, 50, 86400)
    ).to.be.revertedWith("Zaten aktif auction var!");
   });

   it("Açık arttırma oluşturabilmeli", async function () {
      await marketplace.connect(artist).createAuction(0, 50, 86400);

      const auction = await marketplace.auctions(0);

      expect(auction.tokenId).to.equal(0);
      expect(auction.seller).to.equal(await artist.getAddress());
      expect(auction.minBid).to.equal(50);
      expect(auction.isActive).to.equal(true);
   });

  });  

  describe("placeBid Testleri",async function() {
     const MIN_BID = ethers.parseUnits("50", 18);
    const BID_AMOUNT = ethers.parseUnits("100", 18);
    const HIGHER_BID = ethers.parseUnits("150", 18);
    const DURATION = 60 * 60 * 24; 

    beforeEach(async function () {
       await nft.connect(artist).approve(await marketplace.getAddress(), 0);
       await marketplace.connect(artist).createAuction(0, MIN_BID, DURATION);
       await token.connect(buyer).approve(await marketplace.getAddress(), ethers.parseUnits("1000", 18));
    });

    

    it("Açık arttırmanın süresi dolmadan teklif verilmeli",async function () {
      await ethers.provider.send("evm_increaseTime",[DURATION]);
      await ethers.provider.send("evm_mine");

      await expect(marketplace.connect(buyer).placeBid(0,BID_AMOUNT)
      ).to.be.revertedWith("Auction sona ermis!");

    });

    it("teklif minimum tekliften büyük olmalı",async function () {
        await expect(
         marketplace.connect(buyer).placeBid(0, ethers.parseUnits("10", 18))
         ).to.be.revertedWith("Teklif minimum tekliften dusuk!");
    });
    it("teklif mecut tekliften daha yuksek olmalı",async function () {
        await marketplace.connect(buyer).placeBid(0, BID_AMOUNT);
        
        await expect(
            marketplace.connect(stranger).placeBid(0, ethers.parseUnits("90", 18))
        ).to.be.revertedWith("Teklif mevcut en yuksek tekliften buyuk olmali!")
    });

     it("Teklif başarıyla verilmeli", async function () {
        await marketplace.connect(buyer).placeBid(0, BID_AMOUNT);
        
        const auction = await marketplace.auctions(0);
        expect(auction.highestBid).to.equal(BID_AMOUNT);
        expect(auction.highestBidder).to.equal(await buyer.getAddress());
    });

    it("Yeni teklif gelince eski bidder'a iade yapılmalı", async function () {
    await marketplace.connect(buyer).placeBid(0, BID_AMOUNT);
    const [,,, user2] = await ethers.getSigners();

    await token.mint(await user2.getAddress(), ethers.parseUnits("1000", 18));
    await token.connect(user2).approve(await marketplace.getAddress(), ethers.parseUnits("1000", 18));

    const buyerBefore = await token.balanceOf(buyer.address);
    await marketplace.connect(user2).placeBid(0, HIGHER_BID);
    const buyerAfter = await token.balanceOf(buyer.address);
    expect(buyerAfter).to.be.above(buyerBefore);

    const auction = await marketplace.auctions(0);
    expect(auction.highestBidder).to.equal(await user2.getAddress());
    expect(auction.highestBid).to.equal(HIGHER_BID);
});

  });

});