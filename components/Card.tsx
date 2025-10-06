
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-light-bg dark:bg-dark-bg rounded-2xl p-6 shadow-neumorphism-light dark:shadow-neumorphism-dark transition-all ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
