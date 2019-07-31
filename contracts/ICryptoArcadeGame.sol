pragma solidity ^0.5.0;

interface ICryptoArcadeGame {
    function purchaseMatch(address) external payable returns (uint256);

    function getGameMatchPrice() external view returns (uint256);

    function getMatchPlayer(uint256) external view returns (address);

    function getGameMatchScore(uint256) external view returns (uint256);

    function isActive() external view returns (bool);

    function deactivateGame() external;

    function activateGame() external;

    function matchPlayed(uint256, address, uint256) external returns (uint256);

    function getRecordList() external view returns (string memory);

    function getReleasedAmount(address) external view returns (uint256);

    function releaseReward(address payable) external returns (uint256);
}
