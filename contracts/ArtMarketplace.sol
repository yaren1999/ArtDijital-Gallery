// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/// @title Dijital Sanat Pazar Yeri Sözleşmesi
/// @author Yaren 
/// @notice NFT'lerin ART token karşılığında güvenli bir şekilde satılmasını, telif hakkı (Royalty) ve pazar yeri komisyon yönetimini sağlar.
contract ArtMarketplace is Ownable, ReentrancyGuard,ERC721Holder {
    IERC20 public paymentToken;
    IERC721 public nftContract;

        
    /// @notice Pazar yerinin her satıştan alacağı varsayılan komisyon yüzdesi (Başlangıç: %2)
    uint256 public marketplaceFeePercent = 2;


    /// @notice Pazar yerindeki aktif bir ilanın detaylarını tutan veri yapısı
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }

    struct Offer {
      address buyer;
      uint256 amount;
      uint256 createdAt;
      bool isActive;
    }

    struct Auction {
      uint256 tokenId;
      address seller;
      uint256 minBid;
      uint256 highestBid;
      address highestBidder;
      uint256 endTime;
      bool isActive;
    }

    /// @notice NFT ID'lerini pazar yeri ilanlarına bağlayan ana defter
    mapping(uint256 => Listing) public listings;

    mapping(uint256 => Offer[]) public offers;
    mapping(uint256 => Auction) public auctions;

    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ListingCanceled(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId , uint256 indexed newPrice);

    event OfferCreated(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event OfferCanceled(uint256 indexed tokenId, uint256 indexed offerIndex, address indexed buyer);
    event OfferAccepted(  uint256 indexed tokenId, uint256 indexed offerIndex, address indexed buyer,address seller,uint256 amount);

    event AuctionCreated(uint256 indexed tokenId, address indexed seller,uint256 minBid, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId,address indexed bidder,uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 highestBid);

    /// @notice Pazar yeri kontratını ödeme tokenı ve NFT galerisi adresleriyle başlatır
    /// @param _paymentToken Ödemelerde kullanılacak ERC20 (Art Token) kontrat adresi
    /// @param _nftContract Alınıp satılacak olan ERC721 (ArtNFT) kontrat adresi
    constructor(address _paymentToken, address _nftContract) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        nftContract = IERC721(_nftContract);
    }


    /// @notice Sahip olunan bir NFT'yi belirlenen fiyatla pazar yerine listeler
    /// @dev NFT'nin pazar yerine aktarılabilmesi için önceden bu kontrata approve (yetki) verilmiş olması şarttır
    /// @param _tokenId Listelenmek istenen NFT'nin benzersiz ID numarası
    /// @param _price NFT'nin ART token cinsinden satış fiyatı (0'dan büyük olmalıdır)
    function listNFT(uint256 _tokenId, uint256 _price) public {
        require(_price > 0, "Fiyat sifirdan buyuk olmali");
        require(nftContract.ownerOf(_tokenId) == msg.sender, "Bu NFT size ait degil");
        require(nftContract.getApproved(_tokenId) == address(this) || 
                nftContract.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace yetkilendirilmedi");

        listings[_tokenId] = Listing(_tokenId, msg.sender, _price, true);
        
        emit NFTListed(_tokenId, msg.sender, _price);
    }


    /// @notice Pazar yerindeki aktif bir NFT ilanını satın alır
    /// @dev Reentrancy (tekrar giriş) saldırılarına karşı nonReentrant turnikesi ile korunmaktadır. Telif ve komisyonu otomatik dağıtır.
    /// @param _tokenId Satın alınmak istenen NFT'nin benzersiz ID numarası
    function buyNFT(uint256 _tokenId) public nonReentrant {
        Listing storage listing = listings[_tokenId];
        require(listing.isActive, "Bu NFT satista degil");
        require(paymentToken.balanceOf(msg.sender) >= listing.price, "Yetersiz bakiye");
        listing.isActive = false;

        // Pazar yeri komisyon hesabı
        uint256 feeAmount = (listing.price * marketplaceFeePercent) / 100;

        // ERC2981 standardı telif hakkı
        (address royaltyReceiver, uint256 royaltyAmount) = 
            IERC2981(address(nftContract)).royaltyInfo(_tokenId, listing.price);


        // Satıcıya kalacak net tutar
        uint256 sellerAmount = listing.price - feeAmount - royaltyAmount;


        // Para transferlerinin güvenli sırayla yapılması (Önce para çekilir, sonra dağıtılır)
        paymentToken.transferFrom(msg.sender, address(this), listing.price);
        paymentToken.transfer(listing.seller, sellerAmount);
        paymentToken.transfer(royaltyReceiver, royaltyAmount);
        

        // NFT'nin yeni sahibine güvenli transferi
        nftContract.safeTransferFrom(listing.seller, msg.sender, _tokenId);

        emit NFTSold(_tokenId, msg.sender, listing.price);
    }

    /// @notice Aktif bir NFT ilanını iptal eder ve satıştan kaldırır
    /// @dev Bir ilanı sadece o ilanı açmış olan gerçek satıcı iptal edebilir
    /// @param _tokenId Satıştan kaldırılmak istenen NFT'nin ID numarası
    function cancelListing(uint256 _tokenId) public {
        Listing storage listing = listings[_tokenId];
        require(listing.isActive,"Ilan aktif degil");
        require(listing.seller==msg.sender,"satici degilsin");

        listing.isActive = false;
        emit ListingCanceled(_tokenId, msg.sender);
    }


    /// @notice İlandaki bir NFT'nin satış fiyatını günceller
    /// @dev Sadece ilanı açan satıcı fiyatı değiştirebilir ve yeni fiyat 0 olamaz
    /// @param tokenId Fiyatı değiştirilecek olan NFT'nin ID numarası
    /// @param newPrice Belirlenen yeni ART token satış fiyatı
    function updatePrice(uint256 tokenId, uint256 newPrice) public {
      Listing storage listing = listings[tokenId];
      require(listing.isActive, "Ilan aktif degil");
      require(listing.seller == msg.sender, "satici degilsin");
      require(newPrice > 0, "gecersiz fiyat");

      listing.price = newPrice;  
    
      emit PriceUpdated(tokenId, newPrice
      );
    }

    function makeOffer(uint256 tokenId, uint256 amount) public {
      require(amount > 0, "Teklif sifirdan buyuk olmali");
      require(nftContract.ownerOf(tokenId) != msg.sender, "Kendi NFT'nize teklif veremezsiniz");
      require(paymentToken.balanceOf(msg.sender) >= amount, "Yetersiz bakiye");

      require(paymentToken.allowance(msg.sender, address(this)) >= amount,"Kontrata harcama izni (allowance) vermediniz!");

    offers[tokenId].push(
        Offer({
            buyer: msg.sender,
            amount: amount,
            createdAt: block.timestamp,
            isActive: true
        })
    );

      emit OfferCreated(tokenId, msg.sender, amount);
    }

    function cancelOffer(uint256 tokenId, uint256 offerIndex) public {
      require(offerIndex < offers[tokenId].length, "Gecersiz teklif!");

      Offer storage offer = offers[tokenId][offerIndex];

      require(offer.isActive, "Teklif aktif degil!");
      require(offer.buyer == msg.sender, "Bu teklif size ait degil!");

      offer.isActive = false;

      emit OfferCanceled(tokenId, offerIndex, msg.sender);
    }  

    function acceptOffer(uint256 tokenId, uint256 offerIndex) public nonReentrant {
       require(offerIndex < offers[tokenId].length, "Gecersiz teklif!");

       Offer storage offer = offers[tokenId][offerIndex];
       require(offer.isActive, "Teklif aktif degil!");
       require(nftContract.ownerOf(tokenId) == msg.sender, "Sadece NFT sahibi kabul edebilir!");
    
      (address royaltyReceiver , uint256 royaltyAmount) =
      IERC2981(address(nftContract)).royaltyInfo(tokenId, offer.amount);

      uint256 fee = (offer.amount * marketplaceFeePercent) / 100;
      uint256 sellerAmount = offer.amount - fee - royaltyAmount;


      offer.isActive = false;
      listings[tokenId].isActive = false;

      for(uint256 i = 0; i < offers[tokenId].length; i++) {
        offers[tokenId][i].isActive = false;
       }

      paymentToken.transferFrom(offer.buyer, address(this), offer.amount);
      paymentToken.transfer(msg.sender, sellerAmount);  
      paymentToken.transfer(royaltyReceiver, royaltyAmount);
      nftContract.safeTransferFrom(listings[tokenId].seller, offer.buyer, tokenId);

      emit OfferAccepted(tokenId, offerIndex, offer.buyer, msg.sender, offer.amount);
    }

    function createAuction(uint256 tokenId, uint256 minBid , uint256 duration) public {
      require(nftContract.ownerOf(tokenId) == msg.sender,"NFT size ait degil!");
      require(minBid > 0, "Minimum teklif sifirdan buyuk olmali");
      require(duration > 0, "Sure sifirdan buyuk olmali");
      require(!auctions[tokenId].isActive, "Zaten aktif auction var!");

      auctions[tokenId] = Auction({
        tokenId: tokenId,
        seller: msg.sender,
        minBid: minBid,
        highestBid: 0,
        highestBidder: address(0),
        endTime: block.timestamp + duration,
        isActive: true
     });  

      nftContract.safeTransferFrom(msg.sender,address(this),tokenId);

      emit AuctionCreated(tokenId, msg.sender, minBid, block.timestamp + duration);
    }

    function placeBid(uint256 tokenId, uint256 amount) public {
        Auction storage auction = auctions[tokenId];

        require(auction.isActive, "Auction aktif degil!");
        require(block.timestamp < auction.endTime,"Auction sona ermis!");
        require(amount >= auction.minBid,"Teklif minimum tekliften dusuk!");
        require(amount > auction.highestBid,"Teklif mevcut en yuksek tekliften buyuk olmali!");

        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;

        auction.highestBid = amount;
        auction.highestBidder = msg.sender;

        paymentToken.transferFrom(msg.sender,address(this),amount);
        if(previousBidder != address(0)) {paymentToken.transfer(previousBidder, previousBid);}

        emit BidPlaced(tokenId,msg.sender,amount);
    }

    function endAuction(uint256 tokenId) public nonReentrant {
      Auction storage auction = auctions[tokenId];
    
      require(auction.isActive, "Auction aktif degil!");
      require(block.timestamp >= auction.endTime, "Auction henuz bitmedi!");
      require(auction.highestBidder != address(0), "Kazanan yok!");
      require(msg.sender == auction.seller || msg.sender == owner(),"Sadece satici bitirebilir!");

      (address royaltyReceiver, uint256 royaltyAmount) =
         IERC2981(address(nftContract)).royaltyInfo(tokenId, auction.highestBid);
      uint256 fee = (auction.highestBid * marketplaceFeePercent) / 100;
      uint256 sellerAmount = auction.highestBid - fee - royaltyAmount;

      auction.isActive = false;

      paymentToken.transfer(auction.seller, sellerAmount);
      paymentToken.transfer(royaltyReceiver, royaltyAmount);
      nftContract.safeTransferFrom(address(this), auction.highestBidder, tokenId);

      emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
    }


    /// @notice Kontrat içinde biriken pazar yeri komisyon ücretlerini dükkan sahibinin cüzdanına çeker
    /// @dev Sadece kontratın sahibi (Owner) bu biriken fonları tahsil edebilir   
    function withdrawFees() public onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        paymentToken.transfer(owner(), balance);
    }


    /// @notice Pazar yerinin alacağı komisyon oranını günceller
    /// @dev Güvenlik ve suistimali engelleme amacıyla yeni komisyon oranı maksimum %10 ile sınırlandırılmıştır
    /// @param _newFee Belirlenen yeni komisyon yüzdesi (Örn: %5 için 5 girilmelidir)
    function setFeePercent(uint256 _newFee) public onlyOwner {
        require(_newFee <= 10, "Komisyon cok yuksek");
        marketplaceFeePercent = _newFee;
    }
} 