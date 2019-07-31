pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";

contract Zenny is ERC777 {
    constructor(uint256 initialSupply)
        public
        ERC777("Zenny", "ZNY", new address[](0))
    {
        _mint(msg.sender, msg.sender, initialSupply, "", "");
    }
}
