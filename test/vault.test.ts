/**
 * Tests:
 * 1. deposits succeed & emit event
 * 2. proposal creation restricted to members
 * 3. votes counted & threshold triggers execute()
 * 4. execute performs Uniswap swap (use mainnet‑fork or mocked router)
 */

import { expect } from "chai";
import { ethers } from "ethers";
import hre from "hardhat";
import { SyndicateVault } from "../typechain-types";

describe("SyndicateVault", function () {
  let vault: SyndicateVault;
  let owner: any;
  let member1: any;
  let member2: any;
  let member3: any;
  let swapRouter: string;

  beforeEach(async function () {
    [owner, member1, member2, member3] = await hre.ethers.getSigners();

    // Use a dummy address for swapRouter (Uniswap V3 mainnet address for realism)
    swapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

    const VaultFactory = await hre.ethers.getContractFactory("SyndicateVault");
    vault = await VaultFactory.deploy(
      [member1.address, member2.address, member3.address], // _members
      2, // _threshold (2 out of 3 votes needed)
      swapRouter // _swapRouter
    );
    await vault.waitForDeployment();
  });

  it("Should deploy with correct members and accept deposits", async function () {
    // Verify members are set correctly
    expect(await vault.isMember(member1.address)).to.be.true;
    expect(await vault.isMember(member2.address)).to.be.true;
    expect(await vault.isMember(member3.address)).to.be.true;
    expect(await vault.isMember(owner.address)).to.be.false;

    // Verify threshold is set
    expect(await vault.threshold()).to.equal(2);

    // Verify members array
    const members = await vault.getMembers();
    expect(members).to.deep.equal([member1.address, member2.address, member3.address]);

    // Deposit 0.1 ETH from member1
    const depositAmount = hre.ethers.parseEther("0.1");
    await vault.connect(member1).deposit({ value: depositAmount });

    // Check vault balance using getBalance() method
    expect(await vault.getBalance()).to.equal(depositAmount);

    // Also verify via provider balance
    const vaultBalance = await hre.ethers.provider.getBalance(await vault.getAddress());
    expect(vaultBalance).to.equal(depositAmount);
  });

  it("Should emit Deposit event on successful deposit", async function () {
    const depositAmount = hre.ethers.parseEther("0.1");

    await expect(vault.connect(member1).deposit({ value: depositAmount }))
      .to.emit(vault, "Deposit")
      .withArgs(member1.address, depositAmount);
  });

  it("Should reject deposits from non-members", async function () {
    const depositAmount = hre.ethers.parseEther("0.1");

    await expect(
      vault.connect(owner).deposit({ value: depositAmount })
    ).to.be.reverted;
  });
});