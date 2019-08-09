# Design Patterns

The following attack vectors have been taken into account in the design:

- Reentrancy attacks: Pull payment pattern is implemented to avoid DoS attacks when the contract sends ether to player's account. It is the player the one emitting the transaction so in case of reentrancy, only the transfer to the player is affecting and not the whole contract.
- Integer overflows and underflows: Using a verified and tested library (safemath) to avoid issues with mathematical operations.
- Insufficient gas griefing: Contracts don't allowing open generic data that could be used to call other contracts.
- Ownable and Pausable: These patterns are implemented to limit the attack surface and allow an emergency stop in case issues are detected.

Known attacks not addressed at current stage:

- Clients can easily subvert the scores attained and commit them to the blockchain and consume the reward balance. The solution requires the implementation of plugable WASM binaries and Zk-SNARKs so that the game and the gmae contract can share a secret that can be validated in the open without ever revealing the secret.
