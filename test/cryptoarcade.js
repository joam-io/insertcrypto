var CryptoArcade = artifacts.require('CryptoArcade');

let catchRevert = require('./exceptionsHelpers.js').catchRevert;
const BN = web3.utils.BN;

contract('CryptoArcade', function(accounts) {
	const deployerAccount = accounts[0];
	const player1Account = accounts[3];
	const player2Account = accounts[4];
	const player3Account = accounts[5];
	const creatorAccount = accounts[6];

	const matchPrice = 100;

	let instance;
	const MatchStatus = { NotPlayed: 0, Played: 1 };

	const game1 = {
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
		instance = await CryptoArcade.new();
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
				await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});
				await catchRevert(
					instance.registerGame(game1.name, game1.creator, {
						from: creatorAccount
					})
				);
			});
		});

		describe('purchaseMatch()', async () => {
			it('A match can be purchased from an existing game', async () => {
				await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});

				await instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				});

				const playerAddress = await instance.getMatchPlayer(0, 1, {
					from: player1Account
				});

				assert.equal(
					playerAddress,
					player1Account,
					'the match player address should match'
				);
			});

			it('A match cannot be purchased for less than the stipulated price', async () => {
				await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});

				await catchRevert(
					instance.purchaseMatch(0, {
						from: player1Account,
						value: matchPrice - 1
					})
				);
			});

			it('An event is emitted when a match is purchased', async () => {
				const tx = await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});

				const eventData = tx.logs[2].args;

				assert.equal(
					eventData.creator,
					game1.creator,
					'the game creator should match the creator in the event data'
				);
				assert.equal(
					eventData.gameName,
					game1.name,
					'the game name should match the name in the event data'
				);
			});

			it('Players should be refunded any surplus funds sent with the transaction', async () => {
				await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});

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
		});

		it('A match cannot be purchased when the game is inactive', async () => {
			await instance.registerGame(game1.name, game1.creator, {
				from: deployerAccount
			});

			await instance.deactivateGame(0);

			await catchRevert(
				instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				})
			);
		});

		describe('matchPlayed()', async () => {
			it('only the player can send the score of a match', async () => {
				await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});

				await instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				});

				await catchRevert(
					instance.matchPlayed(0, 1, match1.score, {
						from: player2Account
					})
				);
			});

			it('the player can log the score of a game', async () => {
				await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});

				await instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				});

				await instance.matchPlayed(0, 1, match1.score, {
					from: player1Account
				});

				let result = await instance.getGameMatchScore(0, 1, {
					from: player1Account
				});

				assert.equal(
					result,
					match1.score,
					'the score logged should match the score sent in the transaction'
				);
			});

			it('the player can log the score only for matches that have not been already played', async () => {
				await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});

				await instance.purchaseMatch(0, {
					from: player1Account,
					value: matchPrice
				});

				await instance.matchPlayed(0, 1, match1.score, {
					from: player1Account
				});

				await catchRevert(
					instance.matchPlayed(0, 1, match2.score, {
						from: player1Account
					})
				);
			});

			it('the game score is inserted on the list in the correct position', async () => {
				await instance.registerGame(game1.name, game1.creator, {
					from: deployerAccount
				});

				for (let i = 0; i < 10; i++) {
					await instance.purchaseMatch(0, {
						from: player1Account,
						value: matchPrice
					});

					await instance.matchPlayed(0, i + 1, match1.score * i, {
						from: player1Account
					});
				}

				let result = await instance.getRecordList(0);
				let obj = JSON.parse(result);

				assert.equal(obj[0].score, 90, 'the top score should be 90');
			});
		});
	});
});
