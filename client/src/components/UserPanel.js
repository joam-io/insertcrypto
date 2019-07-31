import React from 'react';
import { useWeb3Context } from 'web3-react';
import { Card, Heading, PublicAddress, Text, MetaMaskButton } from 'rimble-ui';
import styled from 'styled-components';
import UserBalance from './UserBalance';

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

const StyledText = styled(Text)`
  color: #525252;
}`;

function UserPanel() {
	const context = useWeb3Context();
	const { active, account } = context;

	if (!active) {
		return (
			<React.Fragment>
				<Card width={1} mt={16} mb={32}>
					<StyledTitle textAlign={'center'}>Player</StyledTitle>
					<StyledText
						fontWeight={4}
						mt={32}
						mb={3}
						display={'flex'}
						alignItems={'left'}
					>
						Insert Crypto is a web3 gaming platform that rethinks the video
						arcade experience of the 80s and 90s. Every time you play, you need
						to pay a small amount (100 wei) in Ether. The amount is
						automatically splitted in 3 parts: 30% goes to the operator of this
						arcade, 30% to a game pot and 40% to the game creators.
					</StyledText>
					<br />
					<MetaMaskButton.Outline
						key="MetaMask"
						disabled={context.connectorName === 'MetaMask'}
						onClick={() => context.setConnector('MetaMask')}
					>
						Connect with MetaMask
					</MetaMaskButton.Outline>
				</Card>
			</React.Fragment>
		);
	} else {
		return (
			<React.Fragment>
				<Card width={1} mt={16} mb={32}>
					<StyledTitle textAlign={'center'}>Player</StyledTitle>
					<PublicAddress address={account || 'None'} mt={16} mb={32} />
					<br />
					<UserBalance />
				</Card>
			</React.Fragment>
		);
	}
}

export default UserPanel;
