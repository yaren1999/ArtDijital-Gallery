// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ArtToken is ERC20, Ownable, ERC20Burnable, Pausable {

    constructor(uint256 initialSupply)
        ERC20("Art Token", "ART")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
    }

    function pause() public onlyOwner { _pause(); }
    function unpause() public onlyOwner { _unpause(); }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value)
        internal virtual override whenNotPaused {
        super._update(from, to, value);
    }
}