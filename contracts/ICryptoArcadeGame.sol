pragma solidity ^0.5.0;

interface ICryptoArcadeGame {
    /**
     * @dev Method to purchase a match in the game. The match is associated to the address passed as a parameter.
     */

    function purchaseMatch(address) external payable returns (uint256);

    /**
     * @dev Method that returns whether the game is active.
     */
    function isActive() external view returns (bool);

    /**
     * @dev Method that activates a deactivated game so the contract becomes again fully operational.
     */
    function activateGame() external;

    /**
     * @dev Method that deactivates a game in case an issue is detected. 
     * Functionallity is limited however all data is preserved intact.
     */
    function deactivateGame() external;

    /**
     * @dev Method that flags a purchased match as being played. Once a match is played, it cannot be played again.
     */
    function playMatch(address _player) external returns (uint256);

    /**
     * @dev Method that stores the score attained by the player in the match.
     * Based on the score, the method also calculates the position in the ranking.
     * If the score makes it to the top 10, the method calculates and returns the number of shares attained.
     */
    function matchPlayed(address, uint256) external returns (uint256);

    /**
     * @dev Method that returns the balance for a given address.
     */
    function playerBalance(address payable) external view returns (uint256);

    /**
     * @dev Method to releases the balance for a player using a pull payment pattern.
     */
    function releaseReward(address payable) external returns (uint256);
}
