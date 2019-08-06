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
		instance = await CryptoArcadeGame.new(game.name, game.creator, matchPrice, {
			from: deployerAccount
		});
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

	describe('purchaseMatch()', async () => {
		it('A match can be purchased from an existing game', async () => {
			await instance.purchaseMatch(player1Account, {
				value: matchPrice
			});

			const availableMatches = await instance.getNumberOfAvailableMatches(
				player1Account
			);

			assert.equal(availableMatches, 1, 'the match count should be the same');
		});
	});

	describe('matchPlayed()', async () => {
		it('The number of matches available to play should be correct', async () => {
			await instance.purchaseMatch(player1Account, {
				value: matchPrice
			});
			await instance.purchaseMatch(player1Account, {
				value: matchPrice
			});

			await instance.playMatch(player1Account);

			await instance.matchPlayed(player1Account, 100);

			await instance.playMatch(player1Account);

			await instance.matchPlayed(player1Account, 100);
		});
	});

	describe('releaseReward()', async () => {
		it('the reward is transferred to the player by explicit request', async () => {
			await instance.purchaseMatch(player1Account, {
				from: deployerAccount,
				value: matchPrice
			});

			await instance.purchaseMatch(player2Account, {
				from: deployerAccount,
				value: matchPrice
			});

			await instance.purchaseMatch(player3Account, {
				from: deployerAccount,
				value: matchPrice
			});

			await instance.playMatch(player1Account, {
				from: deployerAccount
			});

			await instance.matchPlayed(player1Account, match2.score, {
				from: deployerAccount
			});

			await instance.playMatch(player2Account, {
				from: deployerAccount
			});

			await instance.matchPlayed(player2Account, match2.score * 2, {
				from: deployerAccount
			});

			await instance.playMatch(player3Account);

			await instance.matchPlayed(player3Account, match2.score / 2, {
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

		describe('getRecordEntryAddress()', async () => {
			it('Creates the top 10 list one item at a time', async () => {
				let address = null;
				let score = null;
				let top10 = [];

				await instance.purchaseMatch(player1Account, {
					from: deployerAccount,
					value: matchPrice
				});

				await instance.playMatch(player1Account, {
					from: deployerAccount
				});

				await instance.matchPlayed(player1Account, match2.score, {
					from: deployerAccount
				});

				for (let i = 0; i < 10; i++) {
					address = await instance.getRecordEntryAddress(i);
					score = await instance.getRecordEntryScore(i);
					top10.push({ address: address.toString(), score: score.toString() });
				}

				assert.equal(
					top10[0].address,
					player1Account,
					'The 1st position on the list corresponds to Player 1 address'
				);
				assert.equal(
					top10[0].score,
					match2.score,
					'The score at the top of the list is ' + match2.score
				);
			});
		});
	});
});
