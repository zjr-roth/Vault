// SPDX-License-Identifier: MIT
//pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

/**
 * @title SyndicateVault
 * @notice Minimal group‑vault smart contract.
 *  ‣ members[] + threshold
 *  ‣ deposit() payable
 *  ‣ createProposal(tokenIn, tokenOut, amountIn)
 *  ‣ vote(id)
 *  ‣ execute(id)  // calls Uniswap V3 router
 *  ‣ onlyMember modifier
 *  ‣ events: Deposit, ProposalCreated, Voted, Executed
 */
contract SyndicateVault is ReentrancyGuard {
    struct Proposal {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 voteCount;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    address[] public members;
    uint256 public threshold;
    uint256 public proposalCount;

    mapping(address => bool) public isMember;
    mapping(uint256 => Proposal) public proposals;

    ISwapRouter public immutable swapRouter;

    // Events
    event Deposit(address indexed member, uint256 amount);
    event ProposalCreated(
        uint256 indexed proposalId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    );
    event Voted(uint256 indexed proposalId, address indexed member);
    event Executed(uint256 indexed proposalId, uint256 amountOut);

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a member");
        _;
    }

    constructor(
        address[] memory _members,
        uint256 _threshold,
        address _swapRouter
    ) {
        require(_members.length > 0, "No members");
        require(
            _threshold > 0 && _threshold <= _members.length,
            "Invalid threshold"
        );
        require(_swapRouter != address(0), "Invalid router");

        members = _members;
        threshold = _threshold;
        swapRouter = ISwapRouter(_swapRouter);

        // Set member mapping
        for (uint256 i = 0; i < _members.length; i++) {
            require(_members[i] != address(0), "Invalid member");
            require(!isMember[_members[i]], "Duplicate member");
            isMember[_members[i]] = true;
        }
    }

    /**
     * @notice Deposit ETH into the vault
     */
    function deposit() external payable onlyMember nonReentrant {
        require(msg.value > 0, "Amount must be > 0");
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Create a new swap proposal
     * @param tokenIn Input token address (use WETH for ETH)
     * @param tokenOut Output token address
     * @param amountIn Amount of tokenIn to swap
     */
    function createProposal(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external onlyMember returns (uint256) {
        require(
            tokenIn != address(0) && tokenOut != address(0),
            "Invalid tokens"
        );
        require(amountIn > 0, "Amount must be > 0");
        require(address(this).balance >= amountIn, "Insufficient balance");

        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.tokenIn = tokenIn;
        proposal.tokenOut = tokenOut;
        proposal.amountIn = amountIn;
        proposal.voteCount = 0;
        proposal.executed = false;

        emit ProposalCreated(proposalId, tokenIn, tokenOut, amountIn);
        return proposalId;
    }

    /**
     * @notice Vote on a proposal
     * @param proposalId ID of the proposal to vote on
     */
    function vote(uint256 proposalId) external onlyMember {
        require(proposalId < proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        proposal.hasVoted[msg.sender] = true;
        proposal.voteCount++;

        emit Voted(proposalId, msg.sender);
    }

    /**
     * @notice Execute a proposal once threshold is reached
     * @param proposalId ID of the proposal to execute
     */
    function execute(uint256 proposalId) external nonReentrant {
        require(proposalId < proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(proposal.voteCount >= threshold, "Insufficient votes");
        require(
            address(this).balance >= proposal.amountIn,
            "Insufficient balance"
        );

        proposal.executed = true;

        // Prepare swap parameters
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: proposal.tokenIn,
                tokenOut: proposal.tokenOut,
                fee: 3000, // 0.3% fee tier
                recipient: address(this),
                deadline: block.timestamp + 300, // 5 minutes
                amountIn: proposal.amountIn,
                amountOutMinimum: 0, // Accept any amount of tokens out
                sqrtPriceLimitX96: 0 // No price limit
            });

        // Execute swap
        uint256 amountOut = swapRouter.exactInputSingle{
            value: proposal.amountIn
        }(params);

        emit Executed(proposalId, amountOut);
    }

    /**
     * @notice Get proposal details
     */
    function getProposal(
        uint256 proposalId
    )
        external
        view
        returns (
            address tokenIn,
            address tokenOut,
            uint256 amountIn,
            uint256 voteCount,
            bool executed
        )
    {
        require(proposalId < proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.tokenIn,
            proposal.tokenOut,
            proposal.amountIn,
            proposal.voteCount,
            proposal.executed
        );
    }

    /**
     * @notice Check if member has voted on proposal
     */
    function hasVoted(
        uint256 proposalId,
        address member
    ) external view returns (bool) {
        require(proposalId < proposalCount, "Invalid proposal");
        return proposals[proposalId].hasVoted[member];
    }

    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get members array
     */
    function getMembers() external view returns (address[] memory) {
        return members;
    }

    // Receive ETH
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
