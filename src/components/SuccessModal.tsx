
import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 text-center animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-6 w-6 text-gray-500" />
        </button>
        
        <div className="mb-6">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Success!
        </h2>
        
        <p className="text-gray-600 mb-8">
          Funds have been added successfully.
        </p>
        
        <button
          onClick={onClose}
          className="w-full px-6 py-3 text-white bg-green-500 rounded-xl hover:bg-green-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
