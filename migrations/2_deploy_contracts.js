require('openzeppelin-test-helpers/configure')({ web3 });
const { singletons } = require('openzeppelin-test-helpers');

//const SimpleStorage = artifacts.require('./SimpleStorage.sol');

const SafeMath = artifacts.require('SafeMath.sol');

const Strings = artifacts.require('./Strings.sol');
const CryptoArcade = artifacts.require('./CryptoArcade.sol');
const CryptoArcadeGame = artifacts.require('./CryptoArcadeGame.sol');
const RewardSplitter = artifacts.require('./RewardSplitter.sol');
//const Zenny = artifacts.require('./Zenny.sol');

const totalSupply = 80000000;
const name = 'Reacteroids';

module.exports = async function(deployer, network, accounts) {
	// await deployer.deploy(SimpleStorage);
	await deployer.deploy(Strings);
	await deployer.deploy(RewardSplitter);
	await deployer.link(Strings, CryptoArcade);
	await deployer.link(Strings, CryptoArcadeGame);
	await deployer.deploy(CryptoArcadeGame, name, accounts[0]);
	await deployer.deploy(CryptoArcade);

	if (network === 'development') {
		// In a test environment an ERC777 token requires deploying an ERC1820 registry
		await deployer.deploy(SafeMath);
		await singletons.ERC1820Registry(accounts[0]);
	}
	// deployer.deploy(Zenny, totalSupply);
};
