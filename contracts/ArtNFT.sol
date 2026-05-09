// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtNFT is ERC721URIStorage, ERC721Enumerable, ERC2981, Ownable {
    uint256 private _nextTokenId;
    mapping(address => bool) public whitelistedArtists;

    constructor() ERC721("Art Digital Gallery", "ARTNFT") Ownable(msg.sender) {
        _setDefaultRoyalty(msg.sender, 500);
    }

    function addArtist(address artist) public onlyOwner {
        whitelistedArtists[artist] = true;
    }

    function removeArtist(address artist) public onlyOwner {
       whitelistedArtists[artist] = false;
    }

    modifier onlyArtist() {
        require(whitelistedArtists[msg.sender] || owner() == msg.sender, "Sadece onayli sanatcilar!");
        _;
    }

    function safeMint(address to, string memory uri) public onlyArtist {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}