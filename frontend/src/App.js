import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { createInstance } from "fhevmjs";
import ConfidentialVotingABI from "./abis/ConfidentialVoting.json";
import VoteForm from "./components/VoteForm";
import Results from "./components/Results";
import "./App.css";

const CONTRACT_ADDRESS = "0xYourDeployedContractAddress"; // Replace with actual address

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [fhevmInstance, setFhevmInstance] = useState(null);
  const [account, setAccount] = useState(null);
  const [results, setResults] = useState({ yes: 0, no: 0, revealed: false });

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        const signer = provider.getSigner();
        setSigner(signer);
        const accounts = await provider.listAccounts();
        setAccount(accounts[0]);

        const contract = new ethers.Contract(CONTRACT_ADDRESS, ConfidentialVotingABI, signer);
        setContract(contract);

        const fhevmInstance = await createInstance({ network: "zama" });
        setFhevmInstance(fhevmInstance);

        // Check if results are revealed
        const revealed = await contract.resultsRevealed();
        if (revealed) {
          const yesCount = await contract.finalYesCount();
          const noCount = await contract.finalNoCount();
          setResults({ yes: yesCount.toNumber(), no: noCount.toNumber(), revealed: true });
        }
      }
    };
    init();
  }, []);

  const castVote = async (vote) => {
    if (!fhevmInstance || !contract || !signer) return;
    const encryptedVote = await fhevmInstance.encrypt32(vote, account, CONTRACT_ADDRESS);
    const tx = await contract.castVote(encryptedVote.ciphertext, encryptedVote.proof);
    await tx.wait();
    alert("Vote cast successfully!");
  };

  const requestResults = async () => {
    if (!contract) return;
    const tx = await contract.requestResults();
    await tx.wait();
    alert("Results requested!");
  };

  return (
    <div className="App">
      <h1>Confidential Voting dApp</h1>
      {account ? (
        <>
          <p>Connected: {account}</p>
          <VoteForm onVote={castVote} />
          <Results results={results} onRequestResults={requestResults} />
        </>
      ) : (
        <button onClick={() => window.ethereum.request({ method: "eth_requestAccounts" })}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default App;
