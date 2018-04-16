pragma solidity 0.4.21;
pragma experimental "v0.5.0";

import { OnlyMargin } from "./OnlyMargin.sol";


/**
 * @title LoanOwner
 * @author dYdX
 *
 * Interface that smart contracts must implement in order to own loans on behalf of other accounts
 */
contract LoanOwner is OnlyMargin {

    // ============ Constructor ============

    function LoanOwner(
        address margin
    )
        public
        OnlyMargin(margin)
    {
    }

    // ============ Public Interface functions ============

    /**
     * Function a contract must implement in order to receive ownership of a loan sell via the
     * transferLoan function or the atomic-assign to the "owner" field in a loan offering.
     *
     * @param  from        Address of the previous owner
     * @param  positionId  Unique ID of the position
     * @return             The address to pass loan ownership to. This address to keep loan
     *                     ownership, 0x0 to reject loan ownership completely.
     */
    function receiveLoanOwnership(
        address from,
        bytes32 positionId
    )
        external
        onlyMargin
        returns (address);

    /**
     * Function a contract must implement in order to allow additional value to be added onto
     * an owned loan. Margin will call this on the owner of a loan during
     * Margin#increasePosition. If true is returned, the implementing contract can assume
     * the additional value was added.
     *
     * @param  from         Lender adding additional funds to the position
     * @param  positionId   Unique ID of the position
     * @param  amountAdded  Amount to be added to the position
     * @return              True if the contract consents to additional value being added,
     *                      false otherwise
     */
    function marginLoanIncreased(
        address from,
        bytes32 positionId,
        uint256 amountAdded
    )
        external
        onlyMargin
        returns (bool);
}