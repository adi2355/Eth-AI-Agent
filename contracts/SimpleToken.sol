// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleToken
 * @dev A simple ERC20 token for testing purposes
 */
contract SimpleToken is ERC20, Ownable {
    // Token parameters
    uint8 private immutable _decimals;

    /**
     * @dev Constructor that creates a new token
     * @param name_ Name of the token
     * @param symbol_ Symbol of the token
     * @param decimals_ Decimals of the token
     * @param initialSupply Initial supply to mint to the deployer
     * @param initialOwner The initial owner of the contract
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {
        _decimals = decimals_;
        _mint(initialOwner, initialSupply * 10**decimals_);
    }

    /**
     * @dev Returns the number of decimals used for the token
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints new tokens to the specified address
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint (not adjusted for decimals)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount * 10**_decimals);
    }
} 