import React from 'react';
import Header from './Header.js';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-white shadow-inner py-4 text-center text-gray-500 text-sm">
        <div className="container mx-auto px-4">
          Bingo Web3 &copy; {new Date().getFullYear()} - Desenvolvido com Ethereum, React e Chainlink VRF
        </div>
      </footer>
    </div>
  );
};

export default Layout;
