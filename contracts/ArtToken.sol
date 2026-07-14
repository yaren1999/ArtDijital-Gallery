// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";


/// @title Galerinin Yerel Yönetim ve Ödeme Tokenı (Art Token)
/// @author Yaren 
/// @notice Pazar yerindeki sanat eserlerini satın almak ve galeri ekosisteminde ödemeler yapmak için kullanılır.
contract ArtToken is ERC20, Ownable, ERC20Burnable, Pausable {


    /// @notice Kontratı ayağa kaldırır ve ilk arzı kurucuya aktarır
    /// @param initialSupply Kontrat dağıtıldığında basılacak ilk token miktarı 
    constructor(uint256 initialSupply)
        ERC20("Art Token", "ART")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }


    /// @notice Acil durumlarda tüm token transferlerini durdurur
    /// @dev Sadece kontratın sahibi (Owner) tetikleyebilir
    function pause() public onlyOwner { _pause(); }


    /// @notice Durdurulmuş olan token transferlerini yeniden aktif hale getirir
    /// @dev Sadece kontratın sahibi (Owner) tetikleyebilir
    function unpause() public onlyOwner { _unpause(); }


    /// @notice Piyasaya yeni token basar ve arzı artırır
    /// @dev Sadece kontratın sahibi (Owner) tetikleyebilir
    /// @param to Yeni basılan tokenların gönderileceği cüzdan adresi
    /// @param amount Basılacak token miktarı
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /// @dev OpenZeppelin kütüphanelerinin çakışmaması ve transfer anında pausable kontrolü için ezilen (override) iç fonksiyon
    function _update(address from, address to, uint256 value)
        internal virtual override whenNotPaused {
        super._update(from, to, value);
    }
}