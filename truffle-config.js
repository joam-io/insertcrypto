const path = require('path');

const HDWalletProvider = require('truffle-hdwallet-provider');
const fs = require('fs');
const mnemonic = fs
	.readFileSync('.secret')
	.toString()
	.trim();
const infuraURL =
	'https://rinkeby.infura.io/v3/7efa80cf885e455cafe8ddcbef936e84';

module.exports = {
	// See <http://truffleframework.com/docs/advanced/configuration>
	// to customize your Truffle configuration!
	contracts_build_directory: path.join(__dirname, 'client/src/contracts'),
	networks: {
		development: {
			host: 'localhost',
			port: 8545,
			network_id: '*',
			gas: 8000000
		},
		rinkeby: {
			provider: () => new HDWalletProvider(mnemonic, infuraURL),
			network_id: 4, // Rinkeby's network id
			gas: 7000000
		}
	},
	compilers: {
		solc: {
			version: '0.5.0',
			settings: {
				optimizer: {
					enabled: true,
					runs: 200
				}
			}
		}
	}
};
