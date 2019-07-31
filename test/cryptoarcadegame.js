var CryptoArcadeGame = artifacts.require('CryptoArcadeGame');

let catchRevert = require('./exceptionsHelpers.js').catchRevert;
const BN = web3.utils.BN;

contract('CryptoArcadeGame', function(accounts) {
	const deployerAccount = accounts[0];
	const player1Account = accounts[3];
	const player2Account = accounts[4];
	const player3Account = accounts[5];
	const creatorAccount = accounts[6];

	const matchPrice = 100;

	let instance;
	const MatchStatus = { NotPlayed: 0, Played: 1 };

	const game = {
		name: 'Reacteroids',
		creator: creatorAccount
	};

	const match1 = {
		status: MatchStatus.NotPlayed,
		score: 10
	};

	const match2 = {
		status: MatchStatus.Played,
		score: 1000
	};

	beforeEach(async () => {
		instance = await CryptoArcadeGame.new(game.name, game.creator);
	});

	describe('Setup', async () => {
		it('OWNER should be set to the deploying address', async () => {
			const owner = await instance.owner();
			assert.equal(
				owner,
				deployerAccount,
				'the deploying address should be the owner'
			);
		});
	});

	describe('Functions', () => {
		describe('releaseReward()', async () => {
			it('the reward is transferred to the player by explicit request', async () => {
				await instance.purchaseMatch(player1Account, {
					from: player1Account,
					value: matchPrice
				});

				await instance.purchaseMatch(player2Account, {
					from: player2Account,
					value: matchPrice
				});

				await instance.purchaseMatch(player3Account, {
					from: player3Account,
					value: matchPrice
				});

				await instance.matchPlayed(1, player1Account, match2.score, {
					from: deployerAccount
				});

				await instance.matchPlayed(2, player2Account, match2.score * 2, {
					from: deployerAccount
				});

				await instance.matchPlayed(3, player3Account, match2.score / 2, {
					from: deployerAccount
				});

				await instance.releaseReward(player1Account);
				await instance.releaseReward(player2Account);
				await instance.releaseReward(player3Account);

				let player1Amount = await instance.getReleasedAmount(player1Account);
				let player2Amount = await instance.getReleasedAmount(player2Account);
				let player3Amount = await instance.getReleasedAmount(player3Account);

				assert.equal(
					Math.round(player1Amount),
					107,
					'the top player should receive the right portion of the pot'
				);

				assert.equal(
					Math.round(player2Amount),
					107,
					'the second player should receive the right portion of the pot'
				);

				assert.equal(
					Math.round(player3Amount),
					85,
					'the third player should receive the right portion of the pot'
				);
			});
		});
	});
});
