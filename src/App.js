import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ElectionCards from "./components/ElectionCard";
import VotingPage from "./pages/VotingPage";
import Home from "./pages/Home";
import CreateElection from "./components/CreateElection";
function App() {
    return (
      
        <Router>
            <Routes>
                <Route path="/" element={<ElectionCards />} />
                <Route path="/create" element={<CreateElection />} />
                <Route path="/election/:id" element={<VotingPage />} />
            </Routes>
        </Router>
    );
}

export default App;
