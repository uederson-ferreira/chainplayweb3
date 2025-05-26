import React from 'react';
import AdminPanel from '../components/bingo/AdminPanel.js';
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth.js';
import Card from '../components/base/Card.js';

const AdminPage: React.FC = () => {
  const { isConnected, isAdmin } = useWeb3Auth();

  if (!isConnected) {
    return (
      <Card className="bg-yellow-50 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-2">Conecte sua carteira</h2>
        <p className="text-yellow-800">
          Por favor, conecte sua carteira para acessar o painel de administração.
        </p>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="bg-red-50 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-red-600">
          Esta área é restrita a administradores do sistema.
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPanel />
    </div>
  );
};

export default AdminPage;
