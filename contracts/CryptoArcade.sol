pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "./CryptoArcadeGame.sol";
import "./RewardSplitter.sol";

/**
 * @title CryptoArcade
 * @dev This contract is as a game factory and acts as a proxy between players and games.
 * Operations related to the game will be delegated to the appropriate game instance.
 * 
 * There is a circuit breaker implemented that can only be operated by the owner account, in case a serious issue is detected.
 */
contract CryptoArcade is Ownable, Pausable {
    event LogGameRegistered(
        address indexed creator,
        string gameName,
        uint256 price
    );
    event LogMatchPurchased(address indexed player, uint256 gameId);
    event LogMatchStarted(
        address indexed player,
        uint256 indexed gameId,
        uint256 indexed matchId
    );
    event LogMatchFinished(
        address indexed player,
        uint256 indexed gameId,
        uint256 indexed matchId
    );
    event LogNewRecord(
        address indexed player,
        uint256 indexed gameId,
        uint256 score
    );
    event LogRewardReleased(address indexed player, uint256 amount);

    // The list of games registered to the arcade
    mapping(uint256 => CryptoArcadeGame) private games;
    // The unique game ID generator
    uint256 private numRegisteredGames;

    // Modifiyer that returns any ether paid in excess by the player
    modifier refundExcess(uint256 gameId) {
        _;
        uint256 paidInExcess = msg.value - games[gameId].gameMatchPrice();
        if (paidInExcess > 0) {
            msg.sender.transfer(paidInExcess);
        }
    }

    function() external payable {}

    /**
     * @dev Public constructor that registers a game at creation.
     * The game is represented by the account of the game creator, a name and the cost of playing a match.
     *
     * A registration event is emitted if the creation is successful.
     * @param _name The name of the game
     * @param _creator The address of the creator
     * @param _price The cost of one match
     */
    constructor(string memory _name, address _creator, uint256 _price) public {
        uint256 gameId = numRegisteredGames++;

        games[gameId] = new CryptoArcadeGame(_name, _creator, _price);

        emit LogGameRegistered(_creator, _name, _price);
    }

    /**
     * @dev Method to register a new game to the platform.
     * 
     *  Emits a game registration event if sucessful.
     * @param _name The name of the game
     * @param _creator The address of the creator
     * @param _price The cost of one match
     * @return The new game ID
     */
    function registerGame(string memory _name, address _creator, uint256 _price)
        public
        onlyOwner()
        whenNotPaused()
        returns (uint256)
    {
        uint256 gameId = numRegisteredGames++;

        games[gameId] = new CryptoArcadeGame(_name, _creator, _price);

        emit LogGameRegistered(_creator, _name, _price);
    }

    /**
     * @dev This methods enables all operations for a given game.
     * Games can be deactivated without being removed, in case an issue is detected.
     * 
     * @param _gameId The id of the game to activate
     */
    function activateGame(uint256 _gameId)
        external
        onlyOwner()
        whenNotPaused()
    {
        games[_gameId].activateGame();
    }

    /**
     * @dev This methods disables most of the operations for a given game.
     * Games can be deactivated without being removed, in case an issue is detected.
     * Deactivation keeps all related data safe while it reduces the operations available to authorised accounts.
     * 
     * @param _gameId The id of the game to deactivate
     */
    function deactivateGame(uint256 _gameId)
        external
        onlyOwner()
        whenNotPaused()
    {
        games[_gameId].deactivateGame();
    }

    /**
     * @dev Locates the price of a given game.
     * 
     * @param _gameId The id of the game
     * @return The game's price per match
     */
    function matchPrice(uint256 _gameId) public view returns (uint256) {
        return games[_gameId].gameMatchPrice();
    }

    /**
     * @dev This method enables the purchase of game matches.
     * The cost of the game is the price that the game owner defined at creation.
     * The operation is relayed to the game contract for completion.
     *
     * If the purchase is successful a game purchased event is emitted. 
     * @param _gameId The id of the game to deactivate
     * @return The ID of the match purchased
     */
    function purchaseMatch(uint256 _gameId)
        public
        payable
        refundExcess(_gameId)
        whenNotPaused()
        returns (uint256 matchId)
    {
        matchId = games[_gameId].purchaseMatch.value(msg.value)(msg.sender);
        emit LogMatchPurchased(msg.sender, _gameId);

    }

    /**
     * @dev This method looks up caller's available matches (those that are not in played status) and returns the total number.
     *
     * @param _gameId The id of the game
     * @return The total number of matches for the caller that are not in played status
     */
    function getNumberOfAvailableMatches(uint256 _gameId)
        public
        view
        returns (uint256)
    {
        return games[_gameId].getNumberOfAvailableMatches(msg.sender);
    }

    /**
     * @dev This method looks up caller's available matches (those that are not in played status) and returns the total number.
     *
     * @param _gameId The id of the game
     * @return The total number of matches for the caller that are not in played status
     */
    function getGameMatchScore(uint256 _gameId) public view returns (uint256) {
        return games[_gameId].getNumberOfAvailableMatches(msg.sender);
    }

    /**
     * @dev This method flags a match as played, which consumes it.
     * The status of the match becomes Played so its score can be associated to it.
     *
     * @param _gameId The id of the game
     * @return The ID of the match started
     */
    function playMatch(uint256 _gameId) public returns (uint256 matchId) {
        matchId = games[_gameId].playMatch(msg.sender);
        emit LogMatchStarted(msg.sender, _gameId, matchId);
    }

    /**
     * @dev This method is a proxy to the game method that stores the score of a match played, 
     * calculates whether it falls in the top 10 in which case it also calculates and awards
     * a number of shares to the player. How many depends on the position achieved.
     *
     * The method emits a match finished event and a new record one in case the score deserves it.
     * @param _gameId The id of the game
     * @param _score The score attained
     * @return The number of shares produced by the score (zero if the score doesn't make it to the top 10)
     */
    function matchPlayed(uint256 _gameId, uint256 _score)
        public
        returns (uint256 shares)
    {
        shares = games[_gameId].matchPlayed(msg.sender, _score);
        if (shares > 0) {
            emit LogNewRecord(msg.sender, _gameId, _score);
        }
        emit LogMatchFinished(msg.sender, _gameId, _score);
    }

    /**
     * @dev Method that retrieves the top 10 ranking one piece of data at a time, 
     * to avoid complex operations on-chain.
     *
     * @return The address of the entry in the top 10 'pos' position
     */
    function getRecordEntryAddress(uint256 _gameId, uint256 _pos)
        public
        view
        returns (address)
    {
        require(_pos < 10 && _pos >= 0, "The position must be between 0 and 9");
        return games[_gameId].getRecordEntryAddress(_pos);
    }

    /**
     * @dev Method that retrieves the top 10 ranking one piece of data at a time, 
     * to avoid complex operations on-chain.
     *
     * @return The score of the entry in the top 10 'pos' position
     */
    function getRecordEntryScore(uint256 _gameId, uint256 _pos)
        public
        view
        returns (uint256)
    {
        require(_pos < 10 && _pos >= 0, "The position must be between 0 and 9");
        return games[_gameId].getRecordEntryScore(_pos);
    }

    /**
     * @dev This method is a proxy to the game method that retrieves caller's number of shares in the common game pot.
     *
     * @param _gameId The id of the game
     * @return Caller's total number of shares
     */
    function playerBalance(uint256 _gameId) external view returns (uint256) {
        return games[_gameId].playerBalance(msg.sender);
    }

    /**
     * @dev This method is a proxy to the game pull method that retrieves the balance for a player.
     *
     * The method emits a reward released event.
     * @param _gameId The id of the game
     * @param _player The player
     * @return True if player's balance is released successfully
     */
    function releaseReward(uint256 _gameId, address payable _player)
        public
        returns (bool)
    {
        uint256 amount = games[_gameId].releaseReward(_player);
        emit LogRewardReleased(_player, amount);
        return true;
    }
}
