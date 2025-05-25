import React from 'react';
import { THEME_COLORS } from '../../lib/config';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
}) => {
  // Estilos base
  const baseStyles = 'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Estilos de variante
  const variantStyles = {
    primary: `bg-[${THEME_COLORS.primary}] text-white hover:bg-opacity-90 focus:ring-[${THEME_COLORS.primary}]`,
    secondary: `bg-[${THEME_COLORS.secondary}] text-white hover:bg-opacity-90 focus:ring-[${THEME_COLORS.secondary}]`,
    success: `bg-[${THEME_COLORS.success}] text-white hover:bg-opacity-90 focus:ring-[${THEME_COLORS.success}]`,
    error: `bg-[${THEME_COLORS.error}] text-white hover:bg-opacity-90 focus:ring-[${THEME_COLORS.error}]`,
    warning: `bg-[${THEME_COLORS.warning}] text-white hover:bg-opacity-90 focus:ring-[${THEME_COLORS.warning}]`,
    info: `bg-[${THEME_COLORS.info}] text-white hover:bg-opacity-90 focus:ring-[${THEME_COLORS.info}]`,
    outline: `bg-transparent border border-[${THEME_COLORS.primary}] text-[${THEME_COLORS.primary}] hover:bg-[${THEME_COLORS.primary}] hover:text-white focus:ring-[${THEME_COLORS.primary}]`,
  };
  
  // Estilos de tamanho
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Estilos de largura
  const widthStyles = fullWidth ? 'w-full' : '';
  
  // Estilos de desabilitado
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
