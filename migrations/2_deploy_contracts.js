var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var Moneygram = artifacts.require("./Moneygram.sol");

module.exports = function (deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(Moneygram);
};
