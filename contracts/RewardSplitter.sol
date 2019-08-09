pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title RewardSplitter
 * @dev This contract is based on OpenZeppelin's PaymentSplitter.
 * The original contract didn't allow the addition of new payees and the logic in calculating the reward 
 * has been modfied. In esence it still allows the split of Ether payments among a group of accounts.
 * The sender does not need to be aware that the Ether will be split in this way since
 * it is handled transparently by the contract.
 *
 * The contract follows a _pull payment_ pattern. This means that payments are not automatically forwarded to the
 * accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
 * function.
 */
contract RewardSplitter is Ownable {
    using SafeMath for uint256;

    event PaymentReceived(address from, uint256 amount);
    event PayeeAdded(address account, uint256 position, uint256 shares);
    event PaymentReleased(address to, uint256 amount);

    uint256 private totalShares;
    uint256 private totalReleased;

    mapping(address => uint256) private playerShares;
    mapping(address => uint256) private amountReleased;

    /**
     * @dev The Ether received will be logged with `PaymentReceived` events. Note that these events are not fully
     * reliable: it's possible for a contract to receive Ether without triggering this function. This only affects the
     * reliability of the events, and not the actual splitting of Ether.
     *
     * To learn more about this see the Solidity documentation for [fallback functions].
     *
     * [fallback functions]: https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function
     */
    function() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    /**
     * @dev Getter for the amount of shares held by an account.
     */
    function getAccountShares(address _account) public view returns (uint256) {
        return playerShares[_account];
    }

    function getReleasedAmount(address _account) public view returns (uint256) {
        return amountReleased[_account];
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of Ether they are owed, according to their percentage of the
     * total shares and their previous withdrawals.
     */
    function release(address payable _account)
        public
        returns (uint256 _payment)
    {
        require(
            playerShares[_account] > 0,
            "RewardSplitter: account has no shares"
        );

        uint256 totalReceived = address(this).balance.add(totalReleased);
        _payment = totalReceived
            .mul(playerShares[_account])
            .div(totalShares)
            .sub(amountReleased[_account]);

        require(_payment > 0, "RewardSplitter: account is not due payment");

        amountReleased[_account] = amountReleased[_account].add(_payment);
        totalReleased = totalReleased.add(_payment);

        address(_account).transfer(_payment);
        // address(_account).call.value(_payment);
        emit PaymentReleased(_account, _payment);
    }

    /**
     * @dev This method calculates the reward of a position based on an adhoc scale.
     *
     * @param _pos The position obtained in the ranking, from 0 to 9. Positions greater than 9 get no reward.
     * @return The number of shares attained
     */
    function calculateReward(uint256 _pos)
        internal
        pure
        returns (uint256 _shares)
    {
        assembly {
            switch _pos
                case 0 {
                    _shares := 50
                }
                case 1 {
                    _shares := 45
                }
                case 2 {
                    _shares := 40
                }
                case 3 {
                    _shares := 35
                }
                case 4 {
                    _shares := 30
                }
                case 5 {
                    _shares := 25
                }
                case 6 {
                    _shares := 20
                }
                case 7 {
                    _shares := 15
                }
                case 8 {
                    _shares := 10
                }
                case 9 {
                    _shares := 5
                }
                default {
                    _shares := 0
                }
        }
    }

    /**
     * @dev Add a new payee to the contract
     * 
     * @param _account The address of the payee to add
     * @param _pos The position attain in the ranking
     * @return The number of shares attained for the given position
     */
    function addPayee(address _account, uint256 _pos)
        public
        onlyOwner()
        returns (uint256 _shares)
    {
        require(
            _account != address(0),
            "RewardSplitter: account is the zero address"
        );

        _shares = calculateReward(_pos);

        if (_shares > 0) {
            playerShares[_account] = playerShares[_account].add(_shares);
            totalShares = totalShares.add(_shares);
            emit PayeeAdded(_account, _pos, _shares);
        }
    }
}
