pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";

import "./ICryptoArcadeGame.sol";
import "./RewardSplitter.sol";
import "./Strings.sol";

/**
 * @title CryptoArcadeGame
 * @dev This contract represents the logic and data for each game on the platform.
 * It implements an public interface and the ownable pattern so most operations can only be executed 
 * by the owner (the CryptoArcade contract) to reduce the attacking surface.
 * 
 * There is a circuit breaker implemented that can only be operated by the owner 
 * account, in case a serious issue is detected.
 */
contract CryptoArcadeGame is Ownable, ICryptoArcadeGame {
    event LogMatchPlayed(
        address indexed player,
        string gameName,
        uint256 score
    );

    using Strings for string;
    using Strings for uint256;
    using Strings for address;

    // The default match price
    uint256 public MATCH_PRICE = 4810000000000000 wei;

    // A match can be in 2 states: NotPlayed (when purchased) and Played
    enum MatchStatus {NotPlayed, Played}

    // A game contains the player address, the status of the game and the score attained
    struct GameMatch {
        address player;
        MatchStatus status;
        uint256 score;
    }

    // The name of the game
    string private name;
    // The address of the game owner
    address private creator;
    // The game's top 10 players
    uint256[] private topScores;
    // The contract that contains the reward balance and the shares for each of the players that made it to the top 10
    RewardSplitter private rewardShare;
    // Whether the contract is active or not
    bool private active;
    // The counter for the number of matches
    uint256 private numOfMatches;
    // The hashmap for all the matches purchased
    mapping(uint256 => GameMatch) private matches;
    // The hashmap for the IDs of all the matches that belong to a given player
    mapping(address => uint256[]) private playerAvailableMatches;

    // Restricts the function if the game is not active
    modifier isActiveGame() {
        require(active, "CryptoArcadeGame: The game is not active");
        _;
    }

    // Requires the payment to be at least the match price
    modifier paidEnough() {
        require(
            msg.value >= MATCH_PRICE,
            "The amount paid is not sufficient to purchase the match"
        );
        _;
    }

    // Returns ether paid in excess by the player
    modifier refundExcess() {
        _;
        uint256 paidInExcess = msg.value - MATCH_PRICE;
        if (paidInExcess > 0) {
            msg.sender.transfer(paidInExcess);
        }
    }

    /**
     * @dev Creates a new instance associated to the game creator address and sets
     * the price players will have to pay to play.
     *
     * @param _name The name of the game
     * @param _creator The account address of the game creator
     * @param _price The price per match
     */
    constructor(string memory _name, address _creator, uint256 _price) public {
        name = _name;
        creator = _creator;
        topScores = new uint256[](10);
        numOfMatches = 0;
        rewardShare = new RewardSplitter();
        active = true;
        MATCH_PRICE = _price * 1 wei;
    }

    /**
     * @dev Method that retrieves the price per match in wei
     *
     * @return The price per match in wei
     */
    function getMatchPrice() public view returns (uint256) {
        return MATCH_PRICE;
    }

    /**
     * @dev This methods retrieves the state of the game.
     * The game can be deactivated without being removed, in case an issue is detected.
     * 
     * @return True if active, false otherwise
     */
    function isActive() external view returns (bool) {
        return active;
    }

    /**
     * @dev This methods retrieves the price per match in wei.
     * 
     * @return The price per match in wei
     */
    function gameMatchPrice() public view returns (uint256) {
        return MATCH_PRICE;
    }

    /**
     * @dev This method returns player's number of matches in NotPlayed status.
     *
     * @param _player The address of the player
     * @return The number of matches that are in NotPlayed status
     */
    function getNumberOfAvailableMatches(address _player)
        public
        view
        returns (uint256)
    {
        uint256 totalAvailableMatches = 0;
        for (uint256 i = 0; i < playerAvailableMatches[_player].length; i++) {
            uint256 m = playerAvailableMatches[_player][i];
            GameMatch memory matchData = matches[m];
            if (matchData.status == MatchStatus.NotPlayed) {
                totalAvailableMatches++;
            }
        }
        return totalAvailableMatches;
    }

    /**
     * @dev This method purchases a match for a player.
     * It can only be called from the owner's arcade contract and returns any excess ether paid.
     * The paid ether is transferred to the contract that mamanges the rewards.
     *
     * @param _player The address of the player
     * @return The match ID of the match bought
     */
    function purchaseMatch(address _player)
        external
        payable
        isActiveGame()
        paidEnough()
        refundExcess()
        onlyOwner()
        returns (uint256 matchId)
    {
        matchId = ++numOfMatches;

        matches[matchId] = GameMatch({
            player: _player,
            status: MatchStatus.NotPlayed,
            score: 0
        });

        playerAvailableMatches[_player].push(matchId);

        address(rewardShare).transfer(MATCH_PRICE);
    }

    /**
     * @dev This methods deactivates the game, disabling most of its functionality.
     * The game can be deactivated without being destroyed, in case an issue is detected.
     * The method can only be invoked by the owner contract.
     *
     * @return The match ID of the match bought
     */
    function deactivateGame() external onlyOwner() {
        active = false;
    }

    /**
     * @dev This methods activates the game, enabling most of its functionality.
     * The game can be deactivated without being destroyed, in case an issue is detected.
     * The method can only be invoked by the owner contract.
     *
     * @return The match ID of the match bought
     */
    function activateGame() external onlyOwner() {
        active = true;
    }

    /**
     * @dev This method flags a match as played, which consumes it.
     * The status of the match becomes Played so its score can be associated to it.
     *
     * @param _player The address of the player
     * @return The match ID of the match played
     */
    function playMatch(address _player)
        external
        isActiveGame()
        onlyOwner()
        returns (uint256)
    {
        uint256 matchId = 0;
        for (uint256 i = 0; i < playerAvailableMatches[_player].length; i++) {
            uint256 m = playerAvailableMatches[_player][i];
            GameMatch storage matchData = matches[m];
            if (matchData.status == MatchStatus.NotPlayed) {
                matchData.status = MatchStatus.Played;
                matchId = m;
                return matchId;
            }
        }
        return matchId;
    }

    /**
     * @dev This method stores the score of a match played, calculates whether it falls in
     * the top 10 in which case it also calculates and awards a number of shares to the player.
     * How many depends on the position achieved.
     *
     * The method emits a match played event.
     * @param _player The address of the player
     * @param _score The score attained
     * @return The number of shares produced by the score (zero if the score doesn't make it to the top 10)
     */
    function matchPlayed(address _player, uint256 _score)
        external
        isActiveGame()
        onlyOwner()
        returns (uint256 shares)
    {
        uint256 matchId = 0;
        for (uint256 i = 0; i < playerAvailableMatches[_player].length; i++) {
            uint256 m = playerAvailableMatches[_player][i];
            GameMatch memory matchData = matches[m];
            if (matchData.status == MatchStatus.Played) {
                matchId = m;
                break;
            }
        }

        require(
            matchId != 0,
            "MatchPlayed: There are no matches played to log against"
        );

        require(
            matches[matchId].player == _player,
            "MatchPlayed: The player did not purchase the match"
        );

        matches[matchId].status = MatchStatus.Played;
        matches[matchId].score = _score;
        uint256 pos = insertNewScore(matchId);

        shares = rewardShare.addPayee(_player, pos);

        emit LogMatchPlayed(_player, name, _score);
    }

    /**
     * @dev Internal method that calculates the position on the ranking for a given score.
     * The insertion in the list is done in order.
     *
     * @param _matchId The match with the score
     * @return The position in the ranking that goes from 0 to 9. If the score doesn't make it to the list, 10 is returned.
     */
    function insertNewScore(uint256 _matchId) internal returns (uint256) {
        uint256 newScore = matches[_matchId].score;
        uint256 pos = 10;

        for (uint256 i = 0; i < topScores.length; i++) {
            uint256 currentScore = matches[topScores[i]].score;
            if (newScore > currentScore) {
                pos = i;
                break;
            }
        }

        if (pos < topScores.length) {
            for (uint256 i = topScores.length - 1; i > pos; i--) {
                topScores[i] = topScores[i - 1];
            }
            topScores[pos] = _matchId;
        }

        return pos;
    }

    /**
     * @dev Method that retrieves the top 10 ranking.
     *
     * @return A string with the JSON object that contains the top 10 list
     */
    function getRecordList() external view returns (string memory list) {
        list = "[";
        for (uint256 i = 0; i < topScores.length; i++) {
            list = list.strConcat("{\"p\":").strConcat(i.uint2str()).strConcat(
                ", "
            );
            list = list.strConcat("\"a\":\"").strConcat(
                matches[topScores[i]].player.addressToString()
            );
            list = list
                .strConcat("\", \"s\":")
                .strConcat(matches[topScores[i]].score.uint2str())
                .strConcat("}");
            if (i < topScores.length - 1) {
                list = list.strConcat(",");
            }
        }
        list = list.strConcat("]");
    }

    /**
     * @dev Method that retrieves the top 10 ranking one piece of data at a time, 
     * to avoid complex operations on-chain.
     *
     * @return The address of the entry in the top 10 'pos' position
     */
    function getRecordEntryAddress(uint256 _pos) public view returns (address) {
        require(_pos < 10 && _pos >= 0, "The position must be between 0 and 9");
        return matches[topScores[_pos]].player;
    }

    /**
     * @dev Method that retrieves the top 10 ranking one piece of data at a time, 
     * to avoid complex operations on-chain.
     *
     * @return The score of the entry in the top 10 'pos' position
     */
    function getRecordEntryScore(uint256 _pos) public view returns (uint256) {
        require(_pos < 10 && _pos >= 0, "The position must be between 0 and 9");
        return matches[topScores[_pos]].score;
    }

    /**
     * @dev Method that returns the number of shares of a given player in the common game reward pot.
     *
     * @param _player The address of the player
     * @return The number of shares for the given player in the reward pot
     */
    function playerBalance(address payable _player)
        external
        view
        returns (uint256)
    {
        return rewardShare.getAccountShares(_player);
    }

    /**
     * @dev Method that pays to the player the ether corresponding to the number of shares as a % representation on the total.
     *
     * @param _player The address of the player
     * @return The amount of ether in wei paid to the player
     */
    function releaseReward(address payable _player)
        external
        returns (uint256 amount)
    {
        amount = rewardShare.release(_player);
    }

    /**
     * @dev The amount of Ether already released to a payee.
     *
     * @param _player The address of the player
     */
    function getReleasedAmount(address _player) public view returns (uint256) {
        return rewardShare.getReleasedAmount(_player);
    }
}
