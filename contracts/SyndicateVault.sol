// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SyndicateVault
 * @notice  Minimal group‑vault smart contract.
 *  ‣ members[] + threshold
 *  ‣ deposit() payable
 *  ‣ createProposal(tokenIn, tokenOut, amountIn)
 *  ‣ vote(id)
 *  ‣ execute(id)  // calls Uniswap V3 router
 *  ‣ onlyMember modifier
 *  ‣ events: Deposit, ProposalCreated, Voted, Executed
 */