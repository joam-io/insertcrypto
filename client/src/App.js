import React from 'react';
import { render } from 'react-dom';
import { Flex, Box, theme } from 'rimble-ui';
import { ThemeProvider } from 'styled-components';
import Web3Provider from 'web3-react';
import connectors from './connectors';
import { Reacteroids } from './game/Reacteroids';

import './App.css';

import UserPanel from './components/UserPanel';
import GameRanking from './components/GameRanking';

export default function App() {
	return (
		<ThemeProvider theme={theme}>
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
		</ThemeProvider>
	);
}

const rootElement = document.getElementById('root');
render(<App />, rootElement);
