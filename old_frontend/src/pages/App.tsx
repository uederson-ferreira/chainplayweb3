import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Web3AuthProvider } from '../lib/hooks/useWeb3Auth.js';
import Layout from '../components/layout/Layout.js';
import HomePage from './HomePage.js';
import CreateCardPage from './CreateCardPage.js';
import RegisterNumbersPage from './RegisterNumbersPage.js';
import AdminPage from './AdminPage.js';
import PlayerPage from './PlayerPage.js';
import ParticipateRoundPage from './ParticipateRoundPage.js';
import RoundDetailsPage from './RoundDetailsPage.js';

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
