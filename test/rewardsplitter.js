var RewardSplitter = artifacts.require('RewardSplitter');

let catchRevert = require('./exceptionsHelpers.js').catchRevert;
const BN = web3.utils.BN;

contract('RewardSplitter', function(accounts) {
	const deployerAccount = accounts[0];
	const player1Account = accounts[3];
	const player2Account = accounts[4];
	const player3Account = accounts[5];
	const player4Account = accounts[6];
	const creatorAccount = accounts[7];

	const matchPrice = 1e18;

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
		instance = await RewardSplitter.new({
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
		describe('release()', async () => {
			it('Sending balance to player: one player / 100% of the pot', async () => {
				await instance.send(matchPrice, { from: player1Account });

				await instance.addPayee(player1Account, 0, {
					from: deployerAccount
				});

				const initialBalance = await web3.eth.getBalance(player1Account);

				await instance.release(player1Account);

				const finalBalance = await web3.eth.getBalance(player1Account);

				assert.equal(
					finalBalance - initialBalance,
					matchPrice,
					'Payment should equal 100% of the available balance.'
				);
			});

			it('Sending balance to player: two players / 50% each', async () => {
				await instance.send(matchPrice, { from: player1Account });
				await instance.send(matchPrice, { from: player2Account });

				await instance.addPayee(player1Account, 0, {
					from: deployerAccount
				});

				await instance.addPayee(player2Account, 0, {
					from: deployerAccount
				});

				const initialBalancePlayer1 = await web3.eth.getBalance(player1Account);
				const initialBalancePlayer2 = await web3.eth.getBalance(player2Account);

				const paymentPlayer1 = await instance.release(player1Account);
				const paymentPlayer2 = await instance.release(player2Account);

				const finalBalancePlayer1 = await web3.eth.getBalance(player1Account);
				const finalBalancePlayer2 = await web3.eth.getBalance(player2Account);

				assert.equal(
					finalBalancePlayer1 - initialBalancePlayer1,
					matchPrice,
					'Payment should equal 50% of the available balance.'
				);
				assert.equal(
					finalBalancePlayer2 - initialBalancePlayer2,
					matchPrice,
					'Payment should equal 50% of the available balance.'
				);
			});

			// it('Sending balance to player: four players / 27% 27% 22% 22%', async () => {
			// 	await instance.send(matchPrice, { from: player1Account });
			// 	await instance.send(matchPrice, { from: player2Account });
			// 	await instance.send(matchPrice, { from: player3Account });
			// 	await instance.send(matchPrice, { from: player4Account });
			// 	await instance.send(matchPrice, { from: player4Account });
			// 	await instance.send(matchPrice, { from: player4Account });
			// 	await instance.send(matchPrice, { from: player4Account });
			// 	await instance.send(matchPrice, { from: player4Account });

			// 	await instance.addPayee(player1Account, 0, {
			// 		from: deployerAccount
			// 	});

			// 	await instance.addPayee(player2Account, 0, {
			// 		from: deployerAccount
			// 	});

			// 	await instance.addPayee(player3Account, 2, {
			// 		from: deployerAccount
			// 	});

			// 	await instance.addPayee(player4Account, 2, {
			// 		from: deployerAccount
			// 	});

			// 	const initialBalancePlayer1 = await web3.eth.getBalance(player1Account);
			// 	const initialBalancePlayer2 = await web3.eth.getBalance(player2Account);
			// 	const initialBalancePlayer3 = await web3.eth.getBalance(player3Account);
			// 	const initialBalancePlayer4 = await web3.eth.getBalance(player4Account);

			// 	await instance.release(player1Account);
			// 	await instance.release(player2Account);
			// 	await instance.release(player3Account);
			// 	await instance.release(player4Account);

			// 	const finalBalancePlayer1 = await web3.eth.getBalance(player1Account);
			// 	const finalBalancePlayer2 = await web3.eth.getBalance(player2Account);
			// 	const finalBalancePlayer3 = await web3.eth.getBalance(player3Account);
			// 	const finalBalancePlayer4 = await web3.eth.getBalance(player4Account);

			// 	assert.equal(
			// 		finalBalancePlayer1 - initialBalancePlayer1,
			// 		finalBalancePlayer2 - initialBalancePlayer2,
			// 		'Player1 and Player2 should get the same % on the available balance.'
			// 	);
			// 	assert.equal(
			// 		finalBalancePlayer3 - initialBalancePlayer3,
			// 		finalBalancePlayer4 - initialBalancePlayer4,
			// 		'Player3 and Player4 should get the same % on the available balance.'
			// 	);
			// });
		});
	});
});
