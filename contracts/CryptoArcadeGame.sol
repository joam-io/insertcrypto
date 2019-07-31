pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";

import "./ICryptoArcadeGame.sol";
import "./RewardSplitter.sol";
import "./Strings.sol";

contract CryptoArcadeGame is Ownable, ICryptoArcadeGame {
    event LogNewRecord(address indexed player, uint256 position, uint256 score);
    event LogMatchPurchased(
        address indexed buyer,
        address indexed player,
        string gameName
    );
    event LogMatchPlayed(
        address indexed player,
        string gameName,
        uint256 score
    );
    event LogRewardReleased(address indexed player, uint256 amount);

    using Strings for string;
    using Strings for uint256;
    using Strings for address;

    uint256 MATCH_PRICE = 100 wei;

    enum MatchStatus {NotPlayed, Played}

    struct GameMatch {
        address player;
        MatchStatus status;
        uint256 score;
    }

    string private name;
    address private creator;
    uint256[] private topScores;
    uint256 private rewardPot;
    RewardSplitter private rewardShare;
    bool private active;
    uint256 private numOfMatches;
    mapping(uint256 => GameMatch) private matches;

    modifier isActiveGame() {
        require(active, "CryptoArcadeGame: The game is not active");
        _;
    }

    modifier isMatchPlayer(uint256 _matchId, address _player) {
        require(
            matches[_matchId].player == _player,
            "CryptoArcadeGame: The address did not purchase the match"
        );
        _;
    }

    // Throws an error if the payment submitted is less than what is required to pay for the match
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

    constructor(string memory _name, address _creator) public {
        uint256[] memory scores = new uint256[](10);

        name = _name;
        creator = _creator;
        topScores = scores;
        numOfMatches = 0;
        rewardShare = new RewardSplitter();
        active = true;
    }

    function isActive() external view returns (bool) {
        return active;
    }

    function getGameMatchPrice() external view returns (uint256) {
        return MATCH_PRICE;
    }

    function purchaseMatch(address _player)
        external
        payable
        isActiveGame()
        paidEnough()
        refundExcess()
        returns (uint256 matchId)
    {
        matchId = ++numOfMatches;

        matches[matchId] = GameMatch({
            player: _player,
            status: MatchStatus.NotPlayed,
            score: 0
        });

        address(rewardShare).transfer(MATCH_PRICE);
        emit LogMatchPurchased(msg.sender, _player, name);
    }

    function getMatchPlayer(uint256 _matchId) external view returns (address) {
        return matches[_matchId].player;
    }

    function deactivateGame() external onlyOwner() {
        active = false;
    }

    function activateGame() external onlyOwner() {
        active = true;
    }

    function getGameMatchScore(uint256 _matchId)
        external
        view
        returns (uint256)
    {
        return matches[_matchId].score;
    }

    function matchPlayed(uint256 _matchId, address _player, uint256 _score)
        external
        isActiveGame()
        isMatchPlayer(_matchId, _player)
        onlyOwner()
        returns (uint256 shares)
    {
        require(
            matches[_matchId].status == MatchStatus.NotPlayed,
            "playMatch: The match has already been played"
        );

        matches[_matchId].status = MatchStatus.Played;
        matches[_matchId].score = _score;
        uint256 pos = insertNewScore(_matchId);

        shares = rewardShare.addPayee(_player, pos);

        emit LogMatchPlayed(_player, name, _score);
    }

    function insertNewScore(uint256 _matchId) internal returns (uint256) {
        uint256 newScore = matches[_matchId].score;
        address player = matches[_matchId].player;
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

            emit LogNewRecord(player, pos, newScore);
        }

        return pos;
    }

    function getRecordList() external view returns (string memory list) {
        list = "[";
        for (uint256 i = 0; i < topScores.length; i++) {
            list = list
                .strConcat("{\"address\":\"")
                .strConcat(matches[topScores[i]].player.addressToString())
                .strConcat("\", \"score\":")
                .strConcat(matches[topScores[i]].score.uint2str())
                .strConcat("}");
            if (i < topScores.length - 1) {
                list = list.strConcat(",");
            }
        }
        list = list.strConcat("]");
    }

    function getReleasedAmount(address _player)
        external
        view
        returns (uint256)
    {
        return rewardShare.getReleasedAmount(_player);
    }
    function releaseReward(address payable _player)
        external
        returns (uint256 amount)
    {
        amount = rewardShare.release(_player);
        emit LogRewardReleased(_player, amount);
    }
}
