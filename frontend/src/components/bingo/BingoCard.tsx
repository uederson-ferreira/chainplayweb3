import React from 'react';
import Card from '../base/Card';
import { THEME_COLORS } from '../../lib/config';

interface BingoCardProps {
  id: number;
  rows: number;
  columns: number;
  numbers: number[];
  drawnNumbers?: number[];
  owner: string;
  onClick?: () => void;
  selected?: boolean;
}

const BingoCard: React.FC<BingoCardProps> = ({
  id,
  rows,
  columns,
  numbers,
  drawnNumbers = [],
  owner,
  onClick,
  selected = false,
}) => {
  // Formatar endereço para exibição
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card 
      className={`${selected ? 'ring-2 ring-offset-2' : ''}`}
      style={{ 
        borderColor: selected ? THEME_COLORS.primary : 'transparent',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Cartela #{id}</h3>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
          {formatAddress(owner)}
        </span>
      </div>
      
      <div 
        className="grid gap-2"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {numbers.map((number, index) => {
          const isDrawn = drawnNumbers.includes(number);
          
          return (
            <div 
              key={index}
              className={`
                flex items-center justify-center 
                w-10 h-10 rounded-full 
                ${isDrawn ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-800'}
                font-bold text-lg
              `}
            >
              {number}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default BingoCard;
