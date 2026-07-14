// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";



/// @title Dijital Sanat Galerisi NFT Sözleşmesi
/// @author Yaren Şef
/// @notice Dijital sanat eserlerinin NFT olarak basılmasını, sanatçı whitelist yönetimini ve telif haklarını düzenler.
contract ArtNFT is ERC721URIStorage, ERC721Enumerable, ERC2981, ERC721Burnable, Ownable {
    uint256 private _nextTokenId;

    struct Collection {
        uint256 id;          
        string name;         
        string description;  
        string coverURI;     
        address creator;     
        uint256 createdAt;   
        uint256 nftCount;    
        bool isActive;       
    }

    mapping(uint256 => Collection) public collections;

    uint256 public collectionCounter;


    /// @notice Hangi cüzdanların galeride NFT basmaya yetkili olduğunu tutan defter
    mapping(address => bool) public whitelistedArtists;


    /// @notice NFT kontratını başlatır ve varsayılan telif hakkı oranını %5 olarak belirler
    constructor() ERC721("Art Digital Gallery", "ARTNFT") Ownable(msg.sender) {
        _setDefaultRoyalty(msg.sender, 500);
    }


    /// @notice Bir sanatçıyı galeride NFT basabilmesi için whitelist'e ekler
    /// @dev Sadece kontratın sahibi (Owner) tetikleyebilir
    /// @param artist Whitelist'e alınacak sanatçının cüzdan adresi
    function addArtist(address artist) public onlyOwner {
        whitelistedArtists[artist] = true;
    }


    /// @notice Bir sanatçının NFT basma yetkisini elinden alır
    /// @dev Sadece kontratın sahibi (Owner) tetikleyebilir
    /// @param artist Whitelist'ten çıkarılacak sanatçının cüzdan adresi
    function removeArtist(address artist) public onlyOwner {
       whitelistedArtists[artist] = false;
    }

    function createCollection(
        string memory _name,
        string memory _description,
        string memory _coverURI
    ) public onlyArtist {
        
        require(bytes(_name).length > 0, "isim gerekli");
        require(bytes(_description).length > 0, "Aciklama gerekli");
        require(bytes(_coverURI).length > 0, "Kapak gorseli gerekli");

        collectionCounter++;

        collections[collectionCounter] = Collection({
            id: collectionCounter,
            name: _name,
            description: _description,
            coverURI: _coverURI,
            creator: msg.sender,
            createdAt: block.timestamp,
            nftCount: 0,
            isActive: true
        });
    }

    function getCollection(uint256 _id) public view returns (Collection memory) {
      require(_id > 0 && _id <= collectionCounter, "Gecersiz ID");
      return collections[_id];
    }

    function updateCollection(
      uint256 _id,
      string memory _name,
      string memory _description,
      string memory _coverURI
    )  public {
    Collection storage collection = collections[_id];
    
      require(collection.isActive, "Koleksiyon aktif degil");
      require(collection.creator == msg.sender, "Sadece yaratici guncelleyebilir");
      require(bytes(_name).length > 0, "Isim gerekli");
    
      collection.name = _name;
      collection.description = _description;
      collection.coverURI = _coverURI;
    }

    function deactivateCollection(uint256 _id) public {
       Collection storage collection = collections[_id];
    
       require(collection.isActive, "Zaten pasif");
       require(
         collection.creator == msg.sender || owner() == msg.sender,
         "Yetkiniz yok"
        );

       collection.isActive = false;
   }


    /// @dev Fonksiyonu tetikleyen kişinin onaylı sanatçı veya dükkan sahibi olup olmadığını kontrol eden güvenlik kapısı
    modifier onlyArtist() {
        require(whitelistedArtists[msg.sender] || owner() == msg.sender, "Sadece onayli sanatcilar!");
        _;
    }



    /// @notice Onaylı bir sanatçının galeride yeni bir sanat eseri (NFT) basmasını sağlar
    /// @dev 'onlyArtist' modifier'ı sayesinde sadece whitelist'tekiler veya owner tetikleyebilir
    /// @param to Basılan NFT'nin ilk olarak teslim edileceği cüzdan adresi
    /// @param uri NFT'nin görselini ve metadata bilgilerini barındıran IPFS linki
    function safeMint(address to, string memory uri) public onlyArtist {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }


    /// @dev ERC721 ve ERC721Enumerable kütüphanelerinin transfer sıralamasını senkronize etmek için ezilen iç fonksiyon
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }


    /// @dev Cüzdanlardaki NFT sayım dengesini korumak için ezilen iç fonksiyon
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /// @notice Bir NFT'nin internet üzerindeki metadata (özellik/resim) linkini döner
    /// @param tokenId Linki sorgulanan NFT'nin benzersiz ID numarası
    /// @return NFT'nin tam IPFS veya web adresi (string)
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @dev Kontratın hangi standartları (ERC721, ERC2981 vb.) desteklediğini dış dünyaya bildiren fonksiyon
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981) 
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}