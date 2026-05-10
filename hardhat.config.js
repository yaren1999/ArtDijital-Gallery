require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24", // Versiyonu yükselttik
    settings: {
      evmVersion: "cancun", 
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || "", 
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [], 
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, 
  },

};