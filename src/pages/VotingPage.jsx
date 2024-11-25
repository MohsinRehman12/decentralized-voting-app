import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { VotingAddress, VotingAbi } from "../context/constant";
import { Button } from "@mui/material";

function VotingPage() {
    const { id } = useParams();
    const [candidates, setCandidates] = useState([]);
    const [error, setError] = useState(null);
    const [canVote, setCanVote] = useState(false);
    const [electionStatus, setElectionStatus] = useState("");
    const [signerAddress, setSignerAddress] = useState("");
    const [hasVoted, setHasVoted] = useState(false);

    // Use Web3Provider to connect with MetaMask
    const initializeProvider = async () => {
        try {
            console.log("Initializing provider...");
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            await provider.send("eth_requestAccounts", []); // Request accounts permission
            const signer = provider.getSigner();

            const currentSignerAddress = await signer.getAddress();
            setSignerAddress(currentSignerAddress);
            console.log("Using account:", currentSignerAddress);  // Log the signer address

            // Listen for account changes and update signerAddress accordingly
            window.ethereum.on("accountsChanged", (accounts) => {
                const newSignerAddress = accounts[0];
                setSignerAddress(newSignerAddress);
                console.log("Switched to account:", newSignerAddress);  // Log when account is switched
            });

            return { provider, signer };
        } catch (err) {
            setError("Failed to initialize provider.");
            console.error("Error initializing provider:", err);
        }
    };

    // Fetch election details
    const fetchElectionDetails = async () => {
        try {
            const { signer } = await initializeProvider();
            const contract = new ethers.Contract(VotingAddress, VotingAbi, signer);
            const election = await contract.getElection(id);
            const fetchedCandidates = await contract.getCandidates(id);

            const formattedCandidates = fetchedCandidates.map((candidate) => ({
                name: candidate.name,
                voteCount: candidate.voteCount.toString(),
            }));

            setCandidates(formattedCandidates);

            const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
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

            // Check if the user has already voted
            const hasUserVoted = await contract.hasVoted(id, signerAddress);
            setHasVoted(hasUserVoted);

        } catch (err) {
            console.error("Error fetching election details:", err);
            setError("Failed to load election details.");
        }
    };

    // Voting function
    const vote = async (candidateIndex) => {
        try {
            const { signer } = await initializeProvider();
            const contract = new ethers.Contract(VotingAddress, VotingAbi, signer);

            // Log the election ID, candidate index, and signer address
            console.log("Election ID:", id);
            console.log("Candidate Index:", candidateIndex);
            console.log("Signer Address:", signerAddress);

            // If the user has already voted, return
            if (hasVoted) {
                setError("You have already voted in this election.");
                return;
            }

            // Proceed with voting
            const tx = await contract.vote(id, candidateIndex, {
                gasLimit: 3000000,  // You can try removing this if you're relying on MetaMask to handle gas
            });

            console.log("Voting transaction:", tx);
            // Wait for transaction to be mined
            await tx.wait();
            console.log("Vote successful, transaction hash:", tx.hash);
            setError("Successfully voted!");
            fetchElectionDetails();  // Refresh election details after voting
        } catch (err) {
            console.error("Error during voting:", err);
            setError("An unexpected error occurred. Please try again.");
        }
    };

    // Fetch election details when the component mounts or election id changes
    useEffect(() => {
        fetchElectionDetails();
    }, [id]);

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
                <p>{hasVoted ? "You have already voted." : "You cannot vote in this election."}</p>
            )}
            <Button
                variant="contained"
                color="secondary"
                onClick={fetchElectionDetails}
                style={{ marginTop: "10px" }}
            >
                Refresh
            </Button>
        </div>
    );
}

export default VotingPage;
