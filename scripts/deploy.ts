import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SyndicateVault...");

  // Get the contract factory
  const SyndicateVault = await ethers.getContractFactory("SyndicateVault");

  // Example deployment parameters - adjust as needed
  const members = [
    "0x742d35Cc6634C0532925a3b8D497c9f2b9B44FD9", // Replace with actual member addresses
    "0x8ba1f109551bD432803012645Hac136c3D8504D", // These are example addresses
  ];
  const threshold = 2; // Require 2 votes to execute
  const swapRouter = "0x2626664c2603336E57B271c5C0b26F421741e481"; // Uniswap V3 SwapRouter on Base Goerli

  // Deploy the contract
  const vault = await SyndicateVault.deploy(members, threshold, swapRouter);
  await vault.waitForDeployment();

  const deployedAddress = await vault.getAddress();
  console.log("SyndicateVault deployed to:", deployedAddress);
  console.log("Members:", members);
  console.log("Threshold:", threshold);
  console.log("Swap Router:", swapRouter);

  // Verify deployment by calling a view function
  const contractMembers = await vault.getMembers();
  const contractThreshold = await vault.threshold();
  console.log("Verified - Members from contract:", contractMembers);
  console.log("Verified - Threshold from contract:", contractThreshold.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });