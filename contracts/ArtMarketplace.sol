// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract ArtMarketplace is Ownable {
    IERC20 public paymentToken;
    IERC721 public nftContract;

    uint256 public marketplaceFeePercent = 2;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;

    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event ListingCanceled(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId , uint256 indexed newPrice);

    constructor(address _paymentToken, address _nftContract) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        nftContract = IERC721(_nftContract);
    }

    function listNFT(uint256 _tokenId, uint256 _price) public {
        require(_price > 0, "Fiyat sifirdan buyuk olmali");
        require(nftContract.ownerOf(_tokenId) == msg.sender, "Bu NFT size ait degil");
        require(nftContract.getApproved(_tokenId) == address(this) || 
                nftContract.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace yetkilendirilmedi");

        listings[_tokenId] = Listing(_tokenId, msg.sender, _price, true);
        
        emit NFTListed(_tokenId, msg.sender, _price);
    }

    function buyNFT(uint256 _tokenId) public {
        Listing storage listing = listings[_tokenId];
        require(listing.isActive, "Bu NFT satista degil");
        require(paymentToken.balanceOf(msg.sender) >= listing.price, "Yetersiz bakiye");
        listing.isActive = false;

        uint256 feeAmount = (listing.price * marketplaceFeePercent) / 100;

        (address royaltyReceiver, uint256 royaltyAmount) = 
            IERC2981(address(nftContract)).royaltyInfo(_tokenId, listing.price);

        uint256 sellerAmount = listing.price - feeAmount - royaltyAmount;

        paymentToken.transferFrom(msg.sender, address(this), listing.price);
        paymentToken.transfer(listing.seller, sellerAmount);
        paymentToken.transfer(royaltyReceiver, royaltyAmount);
        
        nftContract.safeTransferFrom(listing.seller, msg.sender, _tokenId);

        emit NFTSold(_tokenId, msg.sender, listing.price);
    }

    function cancelListing(uint256 _tokenId) public {
        Listing storage listing = listings[_tokenId];
        require(listing.isActive,"Ilan aktif degil");
        require(listing.seller==msg.sender,"satici degilsin");

        listing.isActive = false;
        emit ListingCanceled(_tokenId, msg.sender);
    }

     
    function withdrawFees() public onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        paymentToken.transfer(owner(), balance);
    }

    function setFeePercent(uint256 _newFee) public onlyOwner {
        require(_newFee <= 10, "Komisyon cok yuksek");
        marketplaceFeePercent = _newFee;
    }
} 