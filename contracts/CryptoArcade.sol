pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "./CryptoArcadeGame.sol";
import "./RewardSplitter.sol";

/// @author Mary A. Botanist
/// @notice Calculate tree age in years, rounded up, for live trees
/// @dev The Alexandr N. Tetearing algorithm could increase precision
/// @param rings The number of rings from dendrochronological sample
/// @return age in years, rounded up for partial years
contract CryptoArcade is Ownable, Pausable {
    // This contract represents game entities
    // The idea is that games independent from the arcades they are registered to
    // That provides greater flexibility as a gamer can buy a token for a game and spend it in any arcade
    // The contract holds the address of the creators, the top 10 record table, the bounty and the purchased matches per gamer
    // 1. Register new game

    event LogGameRegistered(address indexed creator, string gameName);

    mapping(uint256 => CryptoArcadeGame) private games;
    uint256 private numRegisteredGames;

    // Returns ether paid in excess by the player
    modifier refundExcess(uint256 gameId) {
        _;
        uint256 paidInExcess = msg.value - games[gameId].getGameMatchPrice();
        if (paidInExcess > 0) {
            msg.sender.transfer(paidInExcess);
        }
    }

    function() external payable {}

    function registerGame(string memory _name, address _creator)
        public
        onlyOwner()
        whenNotPaused()
        returns (uint256)
    {
        uint256 gameId = numRegisteredGames++;

        games[gameId] = new CryptoArcadeGame(_name, _creator);

        emit LogGameRegistered(_creator, _name);
    }
    function deactivateGame(uint256 _gameId)
        external
        onlyOwner()
        whenNotPaused()
    {
        games[_gameId].deactivateGame();
    }

    function activateGame(uint256 _gameId)
        external
        onlyOwner()
        whenNotPaused()
    {
        games[_gameId].activateGame();
    }

    function purchaseMatch(uint256 _gameId)
        public
        payable
        refundExcess(_gameId)
        whenNotPaused()
        returns (uint256 matchId)
    {
        matchId = games[_gameId].purchaseMatch.value(msg.value)(msg.sender);
    }

    function getMatchPlayer(uint256 _gameId, uint256 _matchId)
        public
        view
        returns (address)
    {
        return games[_gameId].getMatchPlayer(_matchId);
    }

    function matchPlayed(uint256 _gameId, uint256 _matchId, uint256 _score)
        public
        returns (uint256 shares)
    {
        shares = games[_gameId].matchPlayed(_matchId, msg.sender, _score);
    }

    function getGameMatchScore(uint256 _gameId, uint256 _matchId)
        external
        view
        returns (uint256)
    {
        return games[_gameId].getGameMatchScore(_matchId);
    }

    function getRecordList(uint256 _gameId)
        external
        view
        returns (string memory)
    {
        return games[_gameId].getRecordList();
    }

    function releaseReward(uint256 _gameId, address payable _player)
        public
        returns (uint256 amount)
    {
        amount = games[_gameId].releaseReward(_player);
    }
}
