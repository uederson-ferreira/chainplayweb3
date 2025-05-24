import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3AuthProvider } from './lib/hooks/useWeb3Auth';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CreateCardPage from './pages/CreateCardPage';
import RegisterNumbersPage from './pages/RegisterNumbersPage';
import AdminPage from './pages/AdminPage';
import PlayerPage from './pages/PlayerPage';
import ParticipateRoundPage from './pages/ParticipateRoundPage';
import RoundDetailsPage from './pages/RoundDetailsPage';
import './App.css';

function App() {
  return (
    <Web3AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create-card" element={<CreateCardPage />} />
            <Route path="/register-numbers/:cardId" element={<RegisterNumbersPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/player" element={<PlayerPage />} />
            <Route path="/participate/:roundId" element={<ParticipateRoundPage />} />
            <Route path="/round/:roundId" element={<RoundDetailsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </Web3AuthProvider>
  );
}

export default App;
