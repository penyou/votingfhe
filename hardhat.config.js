require("@nomicfoundation/hardhat-toolbox");
require("fhevm/hardhat");

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    zama: {
      url: "https://devnet.zama.ai",
      accounts: ["YOUR_PRIVATE_KEY"], // Replace with your private key
    },
    hardhat: {
      fhevm: true, // Enable fhEVM mocks for local testing
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
