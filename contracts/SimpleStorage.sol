pragma solidity ^0.5.0;

contract SimpleStorage {
    event ValueChanged(
        address indexed author,
        uint256 oldValue,
        uint256 newValue
    );

    uint256 storedData;

    function set(uint256 x) public {
        emit ValueChanged(msg.sender, storedData, x);
        storedData = x;
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}
