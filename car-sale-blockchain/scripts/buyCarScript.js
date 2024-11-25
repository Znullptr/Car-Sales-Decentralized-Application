// buyCarScript.js

const Web3 = require("web3");

async function buyCarScript() {
    try {
        // Step 1: Set up contract instance
        const CarFactory = artifacts.require("CarFactory");
        const carFactory = await CarFactory.deployed();

        // Step 2: Generate tokenId and approve
        const vin = "VIN12345";
        const tokenId = web3.utils.keccak256(vin);
        const accounts = await web3.eth.getAccounts();
        console.log(tokenId);
        await carFactory.approve(carFactory.address, tokenId, { from: "0x6F905F357a3E61D609BE4f72092465502CE4aFdC" });
        console.log("Approval granted for car transfer.");

        // Step 3: Calculate price in ETH and buy the car
        const priceInUSD = 10000 * 10 ** 6; // Replace with your car's actual price
        const usdToEthRate = 3400 * 10 ** 6;
        const priceInETH = (priceInUSD * 10 ** 18) / usdToEthRate;
        const priceWithBuffer = priceInETH + 0.1;

        await carFactory.buyCar(vin, { from: accounts[0], value: priceWithBuffer.toString() });
        console.log("Car purchased successfully!");
    } catch (error) {
        console.error("Error executing the buyCar script:", error);
    }
    process.exit();
}

module.exports = buyCarScript;
