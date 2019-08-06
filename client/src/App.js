import React from 'react';
import { render } from 'react-dom';
import Web3Provider from 'web3-react';
import connectors from './connectors';
import { Reacteroids } from './components/game/Reacteroids';
import './App.css';

export default function App() {
	return (
		<Web3Provider connectors={connectors} libraryName="ethers.js">
			<Reacteroids width={600} height={600} />
		</Web3Provider>
	);
}

const rootElement = document.getElementById('root');
render(<App />, rootElement);

/* <ThemeProvider theme={theme}>
	<Web3Provider connectors={connectors} libraryName="ethers.js">
		<Flex>
			<Box width={3 / 5} pl={8} pr={8} pt={8}>
				<Reacteroids />
			</Box>
			<Box width={2 / 5} pl={8} pr={32}>
				<UserPanel />
				<GameRanking />
			</Box>
		</Flex>
	</Web3Provider>
</ThemeProvider> */
