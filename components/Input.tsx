
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="w-full bg-light-bg dark:bg-dark-bg rounded-lg p-3 shadow-neumorphism-light-inset dark:shadow-neumorphism-dark-inset focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary transition-all"
      />
    </div>
  );
};

export default Input;
