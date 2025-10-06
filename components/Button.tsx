
import React from 'react';
import Icon from './Icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: 'add' | 'edit' | 'delete' | 'print' | 'save' | 'sparkles' | 'download';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', icon, ...props }) => {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all focus:outline-none";
  
  const variantClasses = {
    primary: 'bg-light-primary text-white shadow-md hover:bg-opacity-90 active:shadow-inner',
    secondary: 'bg-light-bg dark:bg-dark-bg shadow-neumorphism-light dark:shadow-neumorphism-dark hover:shadow-neumorphism-light-inset dark:hover:shadow-neumorphism-dark-inset',
    danger: 'bg-red-500 text-white shadow-md hover:bg-red-600 active:shadow-inner'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {icon && <Icon name={icon} className="w-5 h-5" />}
      {children}
    </button>
  );
};

export default Button;
