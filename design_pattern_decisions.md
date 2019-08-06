# Design Patterns

The project implements the following patterns:

- Pull Payment: Players are the ones requesting the payment of a balance to avoid reentrancy and DoS attacks.
- Ownable: To restrict certain operations to a given address, reducing the attack surface.
- Pausable: Contracts can be paused to allow for investigation in case issues are detected.
