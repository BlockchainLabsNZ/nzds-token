const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenUtil = artifacts.require("FiatTokenUtil");

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

let proxyContractAddress = "";
let proxyAdminAddress = "";
let ownerAddress = "";
let masterMinterAddress = "";
let pauserAddress = "";
let blacklisterAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    OWNER_ADDRESS: ownerAddress,
    MASTERMINTER_ADDRESS: masterMinterAddress,
    PAUSER_ADDRESS: pauserAddress,
    BLACKLISTER_ADDRESS: blacklisterAddress,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require("../config.js"));
}

module.exports = async (deployer, network) => {
  if (
    !proxyContractAddress ||
    some(["development", "coverage"], (v) => network.includes(v))
  ) {
    proxyContractAddress = (await FiatTokenProxy.deployed()).address;
  }

  console.log(`FiatTokenProxy: ${proxyContractAddress}`);

  console.log("Deploying FiatTokenV2 implementation contract...");
  await deployer.deploy(FiatTokenV2);

  const fiatTokenV2 = await FiatTokenV2.deployed();
  console.log("Deployed FiatTokenV2 at", fiatTokenV2.address);
  console.log(
    "Initializing FiatTokenV2 implementation contract..."
  );
  await fiatTokenV2.initialize(
    "NZD Stablecoin",
    "NZDS",
    "NZD",
    6,
    masterMinterAddress,
    pauserAddress,
    blacklisterAddress,
    ownerAddress
  );
  await fiatTokenV2.initializeV2("");

  console.log("Deploying FiatTokenUtil contract...");
  const fiatTokenUtil = await deployer.deploy(
    FiatTokenUtil,
    proxyContractAddress
  );
  console.log("Deployed FiatTokenUtil at", fiatTokenUtil.address);
};
