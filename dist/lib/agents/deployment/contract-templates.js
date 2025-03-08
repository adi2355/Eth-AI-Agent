"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplate = getTemplate;
exports.getAllTemplates = getAllTemplates;
exports.getTemplatesByCategory = getTemplatesByCategory;
exports.registerTemplate = registerTemplate;
// Template registry
const templates = new Map();
// Get a template by ID
async function getTemplate(id) {
    return templates.get(id) || null;
}
// Get all templates
async function getAllTemplates() {
    return Array.from(templates.values());
}
// Get templates by category
async function getTemplatesByCategory(category) {
    return Array.from(templates.values()).filter(template => template.category === category);
}
// Register a template
function registerTemplate(template) {
    templates.set(template.id, template);
}
// ERC20 Token Template
const erc20TokenTemplate = {
    id: 'erc20-token',
    name: 'ERC20 Token',
    description: 'Standard ERC20 token with name, symbol, and supply',
    category: 'token',
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract {{name}} is ERC20, Ownable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        _mint(_owner, _initialSupply * 10 ** decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`,
    parameters: [
        {
            name: 'name',
            description: 'Token name',
            type: 'string',
            required: true,
            defaultValue: 'My Token'
        },
        {
            name: '_name',
            description: 'Token name parameter',
            type: 'string',
            required: true,
            defaultValue: 'My Token'
        },
        {
            name: '_symbol',
            description: 'Token symbol',
            type: 'string',
            required: true,
            defaultValue: 'MTK'
        },
        {
            name: '_initialSupply',
            description: 'Initial token supply',
            type: 'uint256',
            required: true,
            defaultValue: '1000000'
        },
        {
            name: '_owner',
            description: 'Token owner address',
            type: 'address',
            required: true
        }
    ],
    defaultValues: {
        name: 'MyToken'
    },
    version: '1.0.0',
    author: 'BlockchainGPT'
};
// NFT Collection Template
const nftCollectionTemplate = {
    id: 'nft-collection',
    name: 'NFT Collection',
    description: 'ERC721 NFT collection with metadata',
    category: 'nft',
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract {{name}} is ERC721Enumerable, Ownable {
    using Strings for uint256;
    
    string public baseURI;
    uint256 public maxSupply;
    uint256 public price;
    bool public saleIsActive = false;
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        uint256 _maxSupply,
        uint256 _price,
        address _owner
    ) ERC721(_name, _symbol) Ownable(_owner) {
        baseURI = _initBaseURI;
        maxSupply = _maxSupply;
        price = _price;
    }
    
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
    }
    
    function mint(uint256 numberOfTokens) public payable {
        require(saleIsActive, "Sale is not active");
        require(numberOfTokens > 0, "Must mint at least 1 token");
        require(totalSupply() + numberOfTokens <= maxSupply, "Would exceed max supply");
        require(msg.value >= price * numberOfTokens, "Insufficient payment");
        
        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 tokenId = totalSupply() + 1;
            _safeMint(msg.sender, tokenId);
        }
    }
    
    function setSaleState(bool _saleIsActive) public onlyOwner {
        saleIsActive = _saleIsActive;
    }
    
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }
    
    function setPrice(uint256 _newPrice) public onlyOwner {
        price = _newPrice;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}`,
    parameters: [
        {
            name: 'name',
            description: 'Contract name',
            type: 'string',
            required: true,
            defaultValue: 'MyNFTCollection'
        },
        {
            name: '_name',
            description: 'Collection name',
            type: 'string',
            required: true,
            defaultValue: 'My NFT Collection'
        },
        {
            name: '_symbol',
            description: 'Collection symbol',
            type: 'string',
            required: true,
            defaultValue: 'MNFT'
        },
        {
            name: '_initBaseURI',
            description: 'Base URI for token metadata',
            type: 'string',
            required: true,
            defaultValue: 'https://example.com/metadata/'
        },
        {
            name: '_maxSupply',
            description: 'Maximum supply of NFTs',
            type: 'uint256',
            required: true,
            defaultValue: '10000'
        },
        {
            name: '_price',
            description: 'Price per NFT in wei',
            type: 'uint256',
            required: true,
            defaultValue: '50000000000000000' // 0.05 ETH
        },
        {
            name: '_owner',
            description: 'Collection owner address',
            type: 'address',
            required: true
        }
    ],
    defaultValues: {
        name: 'MyNFTCollection'
    },
    version: '1.0.0',
    author: 'BlockchainGPT'
};
// Simple Storage Template
const simpleStorageTemplate = {
    id: 'simple-storage',
    name: 'Simple Storage',
    description: 'Basic contract for storing and retrieving a value',
    category: 'utility',
    source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract {{name}} {
    uint256 private value;
    address public owner;
    
    event ValueChanged(uint256 newValue);
    
    constructor(uint256 _initialValue) {
        value = _initialValue;
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    function setValue(uint256 _newValue) public onlyOwner {
        value = _newValue;
        emit ValueChanged(_newValue);
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
    
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}`,
    parameters: [
        {
            name: 'name',
            description: 'Contract name',
            type: 'string',
            required: true,
            defaultValue: 'SimpleStorage'
        },
        {
            name: '_initialValue',
            description: 'Initial stored value',
            type: 'uint256',
            required: true,
            defaultValue: '0'
        }
    ],
    defaultValues: {
        name: 'SimpleStorage'
    },
    version: '1.0.0',
    author: 'BlockchainGPT'
};
// Register templates
registerTemplate(erc20TokenTemplate);
registerTemplate(nftCollectionTemplate);
registerTemplate(simpleStorageTemplate);
