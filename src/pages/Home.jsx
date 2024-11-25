import { ethers } from 'ethers';
import { VotingAddress, VotingAbi } from '../context/constant';
import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import React from 'react'
import { useParams } from "react-router-dom";

const Home = () => {
    const { id } = useParams();
    const [candidates, setCandidates] = useState([]);
    const [error, setError] = useState(null);
    const [canVote, setCanVote] = useState(false);
    const [electionStatus, setElectionStatus] = useState("");
    const [signerAddress, setSignerAddress] = useState("");
    const [hasVoted, setHasVoted] = useState(false);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(VotingAddress, VotingAbi, signer);

    const fetchElectionDetails = async () => {
        try {
          const election = await contract.getElection(0); // Use the appropriate election ID
          const currentTime = Math.floor(Date.now() / 1000);
      
          console.log("Current time (UNIX timestamp):", currentTime);
          console.log("Election start time (UNIX timestamp):", election.startTime.toString());
          console.log("Election end time (UNIX timestamp):", election.endTime.toString());
      
          if (currentTime < election.startTime.toNumber()) {
            setElectionStatus("Election has not started yet.");
            setCanVote(false);
          } else if (currentTime > election.endTime.toNumber()) {
            setElectionStatus("Election has ended.");
            setCanVote(false);
          } else {
            setElectionStatus("Election is ongoing.");
            setCanVote(true);
          }
      
          setCandidates(election.candidates.map((candidate) => ({
            name: candidate.name,
            voteCount: candidate.voteCount.toString()
          })));
        } catch (err) {
          console.error("Error fetching election details:", err);
          setError("Failed to load election details.");
        }
      };

      const vote = async (candidateIndex) => {
        try {
          const hasVoted = await contract.hasVoted(0, signerAddress);
          if (hasVoted) {
            setError("You have already voted in this election.");
            setCanVote(false);
            return;
          }
      
          if (candidateIndex < 0 || candidateIndex >= candidates.length) {
            setError("Invalid candidate index.");
            return;
          }
      
          const tx = await contract.vote(0, candidateIndex);
          const receipt = await tx.wait();
      
          console.log("Transaction Hash:", receipt.transactionHash);
          setError("Successfully voted!");
      
          fetchElectionDetails();  // Refresh election details after voting
        } catch (err) {
          console.error("Error during voting:", err);
          setError("An unexpected error occurred. Please try again.");
        }
      };
      
      
      return (
        <div>
          <h1>Election {id}</h1>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <p>{electionStatus}</p>
          {canVote ? (
            <ul>
              {candidates.map((candidate, index) => (
                <li key={index}>
                  {candidate.name}: {candidate.voteCount} votes
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => vote(index)}
                    style={{ marginLeft: "10px" }}
                  >
                    Vote
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>You cannot vote in this election.</p>
          )}
        </div>
      );
      
}

export default Home