
import React from 'react';
import Icon from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div 
        className="bg-light-bg dark:bg-dark-bg rounded-2xl p-8 shadow-neumorphism-light dark:shadow-neumorphism-dark w-full max-w-lg mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-light-primary dark:text-dark-primary">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:shadow-neumorphism-light dark:hover:shadow-neumorphism-dark">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
