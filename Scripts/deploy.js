const { ethers } = require("hardhat");

async function main() {
  const ArtToken = await hre.ethers.getContractFactory("ArtToken");
  const token = await ArtToken.deploy(hre.ethers.parseUnits("1000000", 18));
  await token.waitForDeployment();
  console.log("ArtToken adresi:", await token.getAddress());

  // ArtNFT deploy kısmı
  const ArtNFT = await hre.ethers.getContractFactory("ArtNFT");
  const nft = await ArtNFT.deploy();
  await nft.waitForDeployment();
  console.log("ArtNFT adresi:", await nft.getAddress());

  const ArtMarketplace = await hre.ethers.getContractFactory("ArtMarketplace");
  const marketplace = await ArtMarketplace.deploy(
    await token.getAddress(),
    await nft.getAddress()
  );
  await marketplace.waitForDeployment();
  console.log("ArtMarketplace adresi:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});