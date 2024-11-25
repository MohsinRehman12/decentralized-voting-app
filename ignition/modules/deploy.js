const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy the MultiElection contract
    const MultiElection = await hre.ethers.getContractFactory("MultiElection");
    const multiElection = await MultiElection.deploy();

    await multiElection.deployed();
    console.log("MultiElection contract deployed to:", multiElection.address);

    // Adding 3 elections dynamically
    const elections = [
        {
            title: "Presidential Election",
            candidates: ["Alice", "Bob", "Charlie"],
            startTime: Math.floor(Date.now() / 1000) + 60, // Starts in 1 minute
            endTime: Math.floor(Date.now() / 1000) + 600, // Ends in 10 minutes
        },
        {
            title: "City Council Election",
            candidates: ["David", "Eve", "Frank"],
            startTime: Math.floor(Date.now() / 1000), // Starts in 1 minute
            endTime: Math.floor(Date.now() / 1000) + 600, // Ends in 10 minutes
        },
        {
            title: "School Board Election",
            candidates: ["Grace", "Hank", "Ivy"],
            startTime: Math.floor(Date.now() / 1000), // Starts in 1 minute
            endTime: Math.floor(Date.now() / 1000) + 600, // Ends in 10 minutes
        },
    ];

    for (let i = 0; i < elections.length; i++) {
        const election = elections[i];
        const tx = await multiElection.createElection(
            election.title,
            election.candidates,
            election.startTime,
            election.endTime
        );
        await tx.wait();
        console.log(`Election "${election.title}" created.`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
