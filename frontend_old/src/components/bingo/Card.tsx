import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white shadow-md rounded-lg p-4 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
