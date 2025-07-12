const { ethers } = require("hardhat");

async function main() {
  const votingDuration = 7 * 24 * 60 * 60; // 7 days in seconds
  const ConfidentialVoting = await ethers.getContractFactory("ConfidentialVoting");
  const voting = await ConfidentialVoting.deploy(votingDuration);

  await voting.deployed();
  console.log(`ConfidentialVoting deployed to: ${voting.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
