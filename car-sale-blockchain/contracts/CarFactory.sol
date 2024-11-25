// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarFactory is ERC721URIStorage, Ownable {
    // Structure to represent a Car
    struct Car {
        string vin;
        string model;
        uint256 price;
        address[] ownershipHistory; // Array to store the history of car owners
    }

    // Mapping to store each Car by its VIN (unique identifier)
    mapping(string => Car) public cars;
    mapping(string => bool) public vinExists;

    // Array to store all VINs for easy retrieval
    string[] public allCarVINs;

    // Events triggering
    event CarCreated(string vin, string model, string manufacturer, address owner);
    event CarBought(string vin, address seller, address buyer, uint256 priceInETH);

    address public deployer;

    constructor() ERC721("CarNFT", "CNFT") Ownable() {
        deployer = msg.sender;
    }

    // Create a new car and mint an NFT to represent it
    function createCar(
        string memory _vin,
        string memory _model,
        address _owner,
        string memory _tokenURI,
        uint256 _price
    ) public{
        require(!vinExists[_vin], "Car with this VIN already exists");

        // Create a memory array for the initial ownership history
        address[] memory addresses = new address[](1);
        addresses[0] = _owner; 

        // Register the car in the cars mapping
        cars[_vin] = Car({
            vin: _vin,
            model: _model,
            price: _price,
            ownershipHistory: addresses
        });
        vinExists[_vin] = true;

        // Add VIN to the allCarVINs array
        allCarVINs.push(_vin);

        // Mint an NFT that represents the car
        uint256 tokenId = uint256(keccak256(abi.encodePacked(_vin))); // Generate token ID from the VIN
        _mint(_owner, tokenId);
        _setTokenURI(tokenId, _tokenURI);  // Set metadata (optional)

        emit CarCreated(_vin, _model, "Certified Manufacturer", _owner);
    }

    function buyCar(string memory _vin) public payable {
        uint256 tokenId = uint256(keccak256(abi.encodePacked(_vin)));
        require(ownerOf(tokenId) != msg.sender, "You already own this car");

        // Hardcoded exchange rate for testing
        uint256 usdToEthRate = 3400 * 10**6; 

        // Fetch the price from the car struct
        uint256 priceInUSD = cars[_vin].price; 

        // Calculate price in ETH
        uint256 priceInETH = (priceInUSD * 1 ether) / usdToEthRate;

        require(msg.value >= priceInETH, "Insufficient ETH sent for purchase");
        address previousOwner = ownerOf(tokenId);

        // Transfer ETH to the seller
        _transfer(previousOwner, msg.sender, tokenId);
        payable(previousOwner).transfer(priceInETH);
  
        // Update ownership history
        cars[_vin].ownershipHistory.push(msg.sender);


        emit CarBought(_vin, previousOwner, msg.sender, priceInETH);
    }

    // Get car details by VIN
    function getCarDetails(string memory _vin) public view returns (string memory, string memory, address, string memory, uint256) {
        Car memory car = cars[_vin];
        require(vinExists[_vin], "Car does not exist");

        uint256 tokenId = uint256(keccak256(abi.encodePacked(_vin)));
        address owner = ownerOf(tokenId);
        string memory tokenURI = tokenURI(tokenId);
        return (car.vin, car.model, owner, tokenURI, car.price);
    }

    // Get all car vins
    function getAllCars() public view returns (string[] memory) {
        return allCarVINs;
    }

    // Get the ownership history of the car by VIN
    function getOwnershipHistory(string memory _vin) public view returns (address[] memory) {
        require(vinExists[_vin], "Car does not exist");
        return cars[_vin].ownershipHistory;
    }
}