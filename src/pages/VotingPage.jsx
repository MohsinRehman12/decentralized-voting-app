import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { VotingAddress, VotingAbi } from "../context/constant";
import { Button, CircularProgress } from "@mui/material";

const rpcProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

function VotingPage() {
    const { id } = useParams();
    const [candidates, setCandidates] = useState([]);
    const [error, setError] = useState(null);
    const [canVote, setCanVote] = useState(false);
    const [electionStatus, setElectionStatus] = useState("");
    const [signerAddress, setSignerAddress] = useState("");
    const [hasVoted, setHasVoted] = useState(false);
    const [loading, setLoading] = useState(false);

    
    
    //check if metamask is installed and if not prompt the user to get it
    const initializeMetaMask = async () => {
        if (!window.ethereum) throw new Error("MetaMask is not installed. Please install MetaMask and try again.");
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = window.ethereum.selectedAddress;

        //this listens for when the user switches an account on metamask
        window.ethereum.on("accountsChanged", (accounts) => {
            setSignerAddress(accounts[0]);
        });

        return account;
    };

    // get the contract details using the abi and address from the solidity file
    const getVotingContract = (account) => {
        const signer = rpcProvider.getSigner(account);
        return new ethers.Contract(VotingAddress, VotingAbi, signer);
    };

    // Fetch election details
    const fetchElectionDetails = async () => {
        setLoading(true);
        try {
            const contract = new ethers.Contract(VotingAddress, VotingAbi, rpcProvider);

            // Fetch election details
            const election = await contract.getElection(id);
            const fetchedCandidates = await contract.getCandidates(id);

            const formattedCandidates = fetchedCandidates.map((candidate) => ({
                name: candidate.name,
                voteCount: candidate.voteCount.toString(),
            }));
            setCandidates(formattedCandidates);

            const currentTime = Math.floor(Date.now() / 1000);
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

            // Check if user has voted
            if (signerAddress) {
                const hasUserVoted = await contract.hasVoted(id, signerAddress);
                setHasVoted(hasUserVoted);
            }
        } catch (err) {
            console.error("Error fetching election details:", err);
        } finally {
            setLoading(false);
        }
    };

    // Voting function
    const vote = async (candidateIndex) => {
        if (loading) return;
        try {
            setLoading(true);
            setError(null);

            // Get active account from MetaMask
            const account = await initializeMetaMask();
            console.log("Using account:", account);

            // Initialize contract with JsonRpcProvider
            const contract = getVotingContract(account);

            // Submit the transaction
            const tx = await contract.vote(id, candidateIndex, {
                gasLimit: 3000000,
            });

            console.log("Transaction sent:", tx.hash);
            await tx.wait();
            console.log("Transaction confirmed:", tx.hash);

            // Refresh election details
            fetchElectionDetails();
            setError("Successfully voted!");
        } catch (err) {
            console.error("Error during voting:", err);
            setError("An error occurred during voting. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch election details when the component mounts or election id changes
    useEffect(() => {
        fetchElectionDetails();
    }, [id, signerAddress]);

    return (
        <div>
            <h1>Election {id}</h1>
            {loading ? (
                <CircularProgress />
            ) : (
                <>
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
                        <p>{hasVoted ? "You have already voted." : "You cannot vote in this election."}</p>
                    )}
                    
                </>
            )}
        </div>
    );
}

export default VotingPage;
