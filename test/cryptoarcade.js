var CryptoArcade = artifacts.require('CryptoArcade');

let catchRevert = require('./exceptionsHelpers.js').catchRevert;
const BN = web3.utils.BN;

contract('CryptoArcade', function(accounts) {
	const deployerAccount = accounts[0];
	const player1Account = accounts[3];
	const player2Account = accounts[4];
	const creatorAccount = accounts[6];

	const matchPrice = 100;

	let instance;
	const MatchStatus = { NotPlayed: 0, Played: 1 };

	const game1 = {
		name: 'Reacteroids',
		creator: creatorAccount
	};

	const game2 = {
		name: 'Galaga',
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
		instance = await CryptoArcade.new(game1.name, game1.creator, matchPrice, {
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

	describe('Functions', () => {
		describe('registerGame()', async () => {
			it('only the owner should be able to register a new game', async () => {
				await instance.registerGame(game2.name, game2.creator, matchPrice, {
					from: deployerAccount
				});
				await catchRevert(
					instance.registerGame(game2.name, game2.creator, matchPrice, {
						from: creatorAccount
					})
				);
			});
		});

		describe('purchaseMatch()', async () => {
			it('A match can be purchased for an existing game', async () => {
				await instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				});

				const availableMatches = await instance.getNumberOfAvailableMatches(0, {
					from: player1Account
				});

				assert.equal(
					Number(availableMatches),
					1,
					'the match count should be the same'
				);
			});

			it('A match cannot be purchased for less than the stipulated price', async () => {
				await catchRevert(
					instance.purchaseMatch(0, {
						from: player1Account,
						value: matchPrice - 1
					})
				);
			});

			it('Players should be refunded any surplus funds sent with the transaction', async () => {
				const paymentAmount = matchPrice * 5;

				const prePurchaseBalance = await web3.eth.getBalance(player1Account);
				const purchaseReceipt = await instance.purchaseMatch(0, {
					from: player1Account,
					value: paymentAmount
				});

				const postPurchaseBalance = await web3.eth.getBalance(player1Account);

				const purchaseTx = await web3.eth.getTransaction(purchaseReceipt.tx);
				let purchaseTxCost =
					Number(purchaseTx.gasPrice) * purchaseReceipt.receipt.gasUsed;

				assert.equal(
					postPurchaseBalance,
					new BN(prePurchaseBalance)
						.sub(new BN(matchPrice))
						.sub(new BN(purchaseTxCost))
						.toString(),
					'overpayment should be refunded'
				);
			});

			it('A match cannot be purchased when the game is inactive', async () => {
				await instance.deactivateGame(0);

				await catchRevert(
					instance.purchaseMatch(0, {
						from: player1Account,
						value: matchPrice
					})
				);
			});
		});

		describe('matchPlayed()', async () => {
			it('only the player can send the score of a match', async () => {
				await instance.registerGame(game1.name, game1.creator, matchPrice, {
					from: deployerAccount
				});

				await instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				});

				await catchRevert(
					instance.matchPlayed(0, match1.score, {
						from: player2Account
					})
				);
			});

			it('the player can log the score of a game', async () => {
				await instance.registerGame(game1.name, game1.creator, matchPrice, {
					from: deployerAccount
				});

				await instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				});
				await instance.playMatch(0, {
					from: player1Account
				});

				await instance.playMatch(0, {
					from: player1Account
				});

				await instance.matchPlayed(0, match1.score, {
					from: player1Account
				});
			});

			it('the player can log the score only for matches that have not been already played', async () => {
				await instance.registerGame(game1.name, game1.creator, matchPrice, {
					from: deployerAccount
				});

				await instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				});

				await catchRevert(
					instance.matchPlayed(0, match1.score, {
						from: player1Account
					})
				);
			});

			it('the game score is inserted on the list in the correct position', async () => {
				await instance.registerGame(game1.name, game1.creator, matchPrice, {
					from: deployerAccount
				});

				for (let i = 0; i < 10; i++) {
					await instance.purchaseMatch(0, {
						from: player1Account,
						value: matchPrice
					});

					await instance.playMatch(0, {
						from: player1Account
					});

					await instance.matchPlayed(0, match1.score * i, {
						from: player1Account
					});
				}

				let result = await instance.getRecordList(0);

				let obj = JSON.parse(result);

				assert.equal(obj[0].s, 90, 'the top score should be 90');
			});
		});
	});
});
