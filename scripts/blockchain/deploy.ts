import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Deploy SimpleToken
  const SimpleToken = await ethers.getContractFactory("SimpleToken");
  const token = await SimpleToken.deploy(
    "Test Token", // name
    "TEST",       // symbol
    18,           // decimals
    1000000,      // initial supply
    (await ethers.getSigners())[0].address // owner
  );

  await token.waitForDeployment();
  console.log(`SimpleToken deployed to: ${await token.getAddress()}`);

  // Log some information for the frontend
  console.log("\nDeployment info for frontend:");
  console.log(`{
  "SimpleToken": {
    "address": "${await token.getAddress()}",
    "name": "Test Token",
    "symbol": "TEST",
    "decimals": 18
  }
}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 