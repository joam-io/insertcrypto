const SafeMath = artifacts.require('SafeMath.sol');

const CryptoArcade = artifacts.require('./CryptoArcade.sol');
const CryptoArcadeGame = artifacts.require('./CryptoArcadeGame.sol');
const RewardSplitter = artifacts.require('./RewardSplitter.sol');
//const Zenny = artifacts.require('./Zenny.sol');

const totalSupply = 80000000;

const game1 = {
	name: 'Reacteroids',
	creator: '0x522fe0d2f80f7877f940Eab0c95F4B535c8d8797',
	price: 9000000000000000
};

const arcadeOperator = '0xDd0f1B9a4064460A4522e37B5Af46dE814F75bED';

module.exports = async function(deployer, network) {
	await deployer.deploy(RewardSplitter);
	await deployer.deploy(
		CryptoArcadeGame,
		game1.name,
		game1.creator,
		game1.price
	);
	await deployer.deploy(CryptoArcade, game1.name, arcadeOperator, game1.price);

	if (network === 'development') {
		// In a test environment an ERC777 token requires deploying an ERC1820 registry
		await deployer.deploy(SafeMath);
		//		await singletons.ERC1820Registry(accounts[0]);
	}
	// deployer.deploy(Zenny, totalSupply);
};
