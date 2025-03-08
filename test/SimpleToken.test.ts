import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleToken } from "../typechain-types";

describe("SimpleToken", function () {
  let token: SimpleToken;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const SimpleToken = await ethers.getContractFactory("SimpleToken");
    token = await SimpleToken.deploy(
      "Test Token",
      "TEST",
      18,
      1000000, // 1 million tokens
      owner.address
    ) as SimpleToken;

    await token.waitForDeployment();
  });

  it("Should have the correct name, symbol, and decimals", async function () {
    expect(await token.name()).to.equal("Test Token");
    expect(await token.symbol()).to.equal("TEST");
    expect(await token.decimals()).to.equal(18);
  });

  it("Should assign the initial supply to the owner", async function () {
    const totalSupply = await token.totalSupply();
    expect(await token.balanceOf(owner.address)).to.equal(totalSupply);
    expect(totalSupply).to.equal(ethers.parseUnits("1000000", 18));
  });

  it("Should allow the owner to mint new tokens", async function () {
    const initialBalance = await token.balanceOf(user1.address);
    await token.mint(user1.address, 1000);
    
    const newBalance = await token.balanceOf(user1.address);
    expect(newBalance - initialBalance).to.equal(ethers.parseUnits("1000", 18));
  });

  it("Should not allow non-owners to mint tokens", async function () {
    await expect(
      token.connect(user1).mint(user2.address, 1000)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
  });

  it("Should allow transfers between accounts", async function () {
    // First mint some tokens to user1
    await token.mint(user1.address, 1000);
    
    // Then transfer from user1 to user2
    await token.connect(user1).transfer(user2.address, ethers.parseUnits("500", 18));
    
    expect(await token.balanceOf(user2.address)).to.equal(ethers.parseUnits("500", 18));
  });
}); 