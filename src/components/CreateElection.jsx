import React, { useState } from "react";
import { ethers } from "ethers";
import { VotingAddress, VotingAbi } from "../context/constant";

function CreateElection() {
    const [title, setTitle] = useState("");
    const [candidates, setCandidates] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState(null);

    const handleCreateElection = async () => {
        try {
            setStatus("Creating election...");
            setError(null);

            // Check if window.ethereum is available (MetaMask)
            if (typeof window.ethereum === "undefined") {
                setError("MetaMask is not installed. Please install MetaMask and try again.");
                setStatus("");
                return;
            }

            // Initialize Web3 provider using MetaMask
            const provider = new ethers.providers.Web3Provider(window.ethereum);

            // Request user to connect their account
            await window.ethereum.request({ method: "eth_requestAccounts" });

            // Get signer from the provider
            const signer = provider.getSigner();

            // Initialize contract
            const contract = new ethers.Contract(VotingAddress, VotingAbi, signer);

            // Prepare candidates array
            const candidateArray = candidates.split(",").map((name) => name.trim());

            // Convert times to UNIX timestamp
            const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

            if (startTimestamp >= endTimestamp) {
                setError("Start time must be before end time.");
                setStatus("");
                return;
            }

            // Create election transaction
            const tx = await contract.createElection(title, candidateArray, startTimestamp, endTimestamp);
            await tx.wait();

            setStatus(`Election "${title}" created successfully!`);
            setTitle("");
            setCandidates("");
            setStartTime("");
            setEndTime("");
        } catch (err) {
            console.error("Error creating election:", err);
            setError("Failed to create election. Ensure you're the contract owner and try again.");
            setStatus("");
        }
    };

    return (
        <div>
            <h1>Create New Election</h1>
            {status && <p style={{ color: "green" }}>{status}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <div>
                <label>
                    Election Title:
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter election title"
                    />
                </label>
            </div>
            <div>
                <label>
                    Candidates (comma-separated):
                    <input
                        type="text"
                        value={candidates}
                        onChange={(e) => setCandidates(e.target.value)}
                        placeholder="Enter candidates (e.g., Alice, Bob, Charlie)"
                    />
                </label>
            </div>
            <div>
                <label>
                    Start Time:
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </label>
            </div>
            <div>
                <label>
                    End Time:
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    />
                </label>
            </div>
            <button onClick={handleCreateElection}>Create Election</button>
        </div>
    );
}

export default CreateElection;
