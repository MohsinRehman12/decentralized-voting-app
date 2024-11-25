import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { VotingAddress, VotingAbi } from "../context/constant";
import { Card, CardContent, Typography, Button, CircularProgress } from "@mui/material";

const gradients = [
    "linear-gradient(to right, #a8edea, #fed6e3)",
    "linear-gradient(to right, #ff9a9e, #fad0c4)",
    "linear-gradient(to right, #a18cd1, #fbc2eb)",
    "linear-gradient(to right, #fbc2eb, #a6c1ee)",
    "linear-gradient(to right, #d4fc79, #96e6a1)",
    "linear-gradient(to right, #84fab0, #8fd3f4)",
    "linear-gradient(to right, #fbc2eb, #a6c1ee)",
];

function ElectionCard() {
    const [elections, setElections] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const initializeProvider = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);  // Request account access
        const signer = provider.getSigner();
        const contract = new ethers.Contract(VotingAddress, VotingAbi, signer);

        return { provider, signer, contract };
    };

    const fetchElections = async () => {
        try {
            const { contract } = await initializeProvider();
            const electionCount = await contract.electionCount();
            console.log("Total Elections:", electionCount.toString());

            const fetchedElections = [];
            const currentTime = Math.floor(Date.now() / 1000); // Current time in UNIX timestamp (seconds)

            for (let i = 0; i < electionCount; i++) {
                const election = await contract.getElection(i);
                console.log(`Election ${i}:`, election);

                // Calculate remaining time
                const remainingTime = election.endTime.toNumber() - currentTime;

                fetchedElections.push({
                    id: i,
                    title: election.title,
                    startTime: election.startTime.toString(),
                    endTime: election.endTime.toString(),
                    remainingTime: remainingTime, // Calculate remaining time in seconds
                });
            }

            setElections(fetchedElections);
            setLoading(false);  // Stop loading when data is fetched
        } catch (err) {
            console.error("Error fetching elections:", err);
            setError("Failed to load elections.");
            setLoading(false);  // Stop loading if error occurs
        }
    };

    useEffect(() => {
        fetchElections();
    }, []);

    const handleCardClick = (electionId) => {
        navigate(`/election/${electionId}`);
    };

    const getRandomGradient = () => {
        return gradients[Math.floor(Math.random() * gradients.length)];
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
            {loading ? (
                <CircularProgress style={{ margin: "auto" }} />
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                elections.map((election) => (
                    <Card
                        key={election.id}
                        style={{
                            width: "300px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                        }}
                        onClick={() => handleCardClick(election.id)}
                    >
                        {/* Gradient Header */}
                        <div
                            style={{
                                height: "100px",
                                background: getRandomGradient(),
                                borderTopLeftRadius: "8px",
                                borderTopRightRadius: "8px",
                            }}
                        ></div>
                        {/* Card Content */}
                        <CardContent>
                            <Typography variant="h6" style={{ fontWeight: "bold" }}>
                                {election.title}
                            </Typography>
                            <Typography variant="body2" style={{ color: "#666", marginTop: "8px" }}>
                                {election.remainingTime > 0
                                    ? `Time remaining: ${Math.floor(election.remainingTime / 60)} minutes`
                                    : "Election ended"}
                            </Typography>
                            <Typography variant="body2" style={{ marginTop: "8px" }}>
                                Start Time: {formatDate(election.startTime)}
                            </Typography>
                            <Typography variant="body2" style={{ marginTop: "8px" }}>
                                End Time: {formatDate(election.endTime)}
                            </Typography>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}

export default ElectionCard;
