// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/lib/TFHE.sol";
import "@fhevm/oracle/OracleCaller.sol";
import "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

contract ConfidentialVoting is ZamaFHEVMConfig, OracleCaller {
    euint32 public yesVotes; // Encrypted count of "Yes" votes
    euint32 public noVotes;  // Encrypted count of "No" votes
    mapping(address => bool) public hasVoted; // Track voters
    uint256 public votingEndTime; // Voting deadline
    uint256 public requestID; // Oracle request ID for decryption
    bool public resultsRevealed; // Flag for result revelation
    uint256 public finalYesCount; // Decrypted "Yes" count
    uint256 public finalNoCount;  // Decrypted "No" count

    event VoteCast(address indexed voter);
    event ResultsRequested(uint256 requestID);
    event ResultsRevealed(uint256 yesCount, uint256 noCount);

    constructor(uint256 _votingDuration) {
        yesVotes = TFHE.asEuint32(0);
        noVotes = TFHE.asEuint32(0);
        votingEndTime = block.timestamp + _votingDuration;
    }

    // Cast an encrypted vote (0 for No, 1 for Yes)
    function castVote(bytes calldata encryptedVote, bytes calldata inputProof) external {
        require(block.timestamp <= votingEndTime, "Voting period has ended");
        require(!hasVoted[msg.sender], "Already voted");

        externalEuint32 memory vote = TFHE.asExternalEuint32(encryptedVote, inputProof);
        ebool isYes = TFHE.eq(vote, TFHE.asEuint32(1));

        yesVotes = TFHE.add(yesVotes, TFHE.asEuint32(isYes));
        noVotes = TFHE.add(noVotes, TFHE.asEuint32(TFHE.not(isYes)));

        hasVoted[msg.sender] = true;
        emit VoteCast(msg.sender);
    }

    // Request decryption of vote counts
    function requestResults() external {
        require(block.timestamp > votingEndTime, "Voting period still active");
        require(!resultsRevealed, "Results already revealed");

        euint32[] memory cts = new euint32[](2);
        cts[0] = yesVotes;
        cts[1] = noVotes;

        requestID = Oracle.requestDecryption(cts, this.callback.selector, 0, block.timestamp + 100);
        emit ResultsRequested(requestID);
    }

    // Oracle callback to receive decrypted results
    function callback(uint256 _requestID, uint32[] memory decryptedInputs) public onlyOracle {
        require(_requestID == requestID, "Invalid request ID");
        require(!resultsRevealed, "Results already revealed");

        finalYesCount = decryptedInputs[0];
        finalNoCount = decryptedInputs[1];
        resultsRevealed = true;

        emit ResultsRevealed(finalYesCount, finalNoCount);
    }

    // Get current vote counts (encrypted)
    function getEncryptedCounts() external view returns (bytes memory, bytes memory) {
        return (TFHE.asBytes(yesVotes), TFHE.asBytes(noVotes));
    }
}
