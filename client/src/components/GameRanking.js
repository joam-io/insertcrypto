import React, { Component } from 'react';
import { Card, Heading } from 'rimble-ui';
import SimpleStorageContract from '../contracts/SimpleStorage.json';
import getWeb3 from '../utils/getWeb3';
import styled from 'styled-components';

const StyledTitle = styled(Heading.h2)`
	text-shadow: 0 3px 4px #ab74e3;
	font-family: 'Press Start 2P';
	font-size: 32px;
	font-weight: normal;
	font-style: normal;
	font-stretch: normal;
	line-height: normal;
	letter-spacing: normal;
	text-align: center;
	color: #6913bf;
`;

class UserPanel extends Component {
	constructor(props) {
		super(props);
		this.state = {
			storageValue: 0,
			web3: null,
			accounts: null,
			contract: null
		};
	}

	componentDidMount = async () => {};

	connectToWeb3 = async () => {
		try {
			const web3 = await getWeb3();
			// Use web3 to get the user's accounts.
			const accounts = await web3.eth.getAccounts();

			// Get the contract instance.
			const networkId = await web3.eth.net.getId();
			const deployedNetwork = SimpleStorageContract.networks[networkId];
			const instance = new web3.eth.Contract(
				SimpleStorageContract.abi,
				deployedNetwork && deployedNetwork.address
			);

			// Set web3, accounts, and contract to the state, and then proceed with an
			// example of interacting with the contract's methods.
			console.log("Setting state, why doesn't it render?");
			this.setState({ web3, accounts, storageValue: 0, contract: instance });
		} catch (error) {
			// Catch any errors for any of the above operations.
			alert(
				`Failed to load web3, accounts, or contract. Check console for details.`
			);
			console.error(error);
		}
	};

	handleClick(event) {
		const { contract, accounts } = this.state;
		let value = 100;

		contract.methods
			.set(value)
			.send({ from: accounts[0] })
			.then(result => {
				return contract.methods.get().call();
			})
			.then(result => {
				return this.setState({ storageValue: result });
			});
	}

	render() {
		if (this.state.web3) {
			return 'Conected';
		} else {
			return (
				<Card width={1} mt={32}>
					<StyledTitle textAlign={'center'}>Top 10</StyledTitle>
				</Card>
			);
		}
	}
}

export default UserPanel;
