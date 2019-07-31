import React, { useState, useEffect } from 'react';
import { useWeb3Context } from 'web3-react';
import { Text, Button } from 'rimble-ui';
import { ethers } from 'ethers';
//import SimpleStorageContract from '../contracts/SimpleStorage.json';
import CryptoArcade from '../contracts/CryptoArcade.json';

export default function UserBalance() {
	const context = useWeb3Context();
	const { active } = context;
	const [matchId, setMatchId] = useState(null);
	let contractInstance = null;

	async function purchaseMatch() {
		await contractInstance.purchaseMatch(0);
		setMatchId(0);
	}

	// async function readFromStorage() {
	// 	let response = await contractInstance.get();
	// 	setStorageValue(response.toString());
	// }

	// useEffect(() => {
	// 	contractInstance.on('LogMatchPurchased', readFromStorage);
	// 	// Specify how to clean up after this effect:
	// 	return function cleanup() {
	// 		contractInstance.removeListener('LogMatchPurchased', readFromStorage);
	// 	};
	// });

	if (active) {
		const signer = context.library.getSigner();
		const deployedNetwork = CryptoArcade.networks[context.networkId];
		contractInstance = new ethers.Contract(
			deployedNetwork.address,
			CryptoArcade.abi,
			signer
		);

		return (
			<React.Fragment>
				<Button onClick={() => purchaseMatch()}>Purchase Match</Button>
				<Text>Current value stored is: </Text>
			</React.Fragment>
		);
	} else {
		console.error('Do something about this error');
	}
}
