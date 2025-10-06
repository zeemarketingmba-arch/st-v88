
import React from 'react';
import Icon from './Icon';
import { AppSettings } from '../types';

interface HeaderProps {
  toggleTheme: () => void;
  theme: 'light' | 'dark';
  settings: AppSettings;
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, theme, settings }) => {
  return (
    <header className="no-print bg-light-bg dark:bg-dark-bg p-4 flex justify-between items-center shadow-neumorphism-light dark:shadow-neumorphism-dark sticky top-0 z-10">
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">{settings.schoolName}</h2>
      <button
        onClick={toggleTheme}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-light-bg dark:bg-dark-bg shadow-neumorphism-light dark:shadow-neumorphism-dark hover:shadow-neumorphism-light-inset dark:hover:shadow-neumorphism-dark-inset transition-all text-light-primary dark:text-dark-primary"
        aria-label="Toggle theme"
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} className="w-6 h-6" />
      </button>
    </header>
  );
};

export default Header;
