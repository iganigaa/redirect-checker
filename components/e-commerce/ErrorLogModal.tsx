'use client';

import React from 'react';
import { X, Trash2, Copy, Terminal } from 'lucide-react';
import { AppError } from '@/lib/e-commerce/types';

interface Props {
  errors: AppError[];
  onClose: () => void;
  onClear: () => void;
}

export const ErrorLogModal: React.FC<Props> = ({ errors, onClose, onClear }) => {
  const copyToClipboard = () => {
    const text = errors.map(e => `[${e.timestamp.toLocaleTimeString()}] ${e.message} ${e.itemId ? `(Item: ${e.itemName || e.itemId})` : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    alert("Logs copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 pt-5 pb-4 sm:p-6 flex justify-between items-center z-10">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Terminal className="mr-2 text-red-600" size={20} />
            System Error Logs
          </h3>
          <div className="flex items-center space-x-2">
            <button 
                onClick={copyToClipboard}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                title="Copy to Clipboard"
            >
                <Copy size={18} />
            </button>
            <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
                <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 sm:p-6">
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs text-gray-300">
            {errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <CheckIcon />
                <p className="mt-2">System is healthy. No errors recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {errors.slice().reverse().map((error) => (
                  <div key={error.id} className="border-b border-gray-800 pb-2 last:border-0">
                    <div className="flex items-start">
                       <span className="text-gray-500 mr-2">[{error.timestamp.toLocaleTimeString()}]</span>
                       <span className="text-red-400 flex-1 break-words">{error.message}</span>
                    </div>
                    {error.itemId && (
                      <div className="ml-16 text-gray-600 mt-1">
                          Related to Item: <span className="text-gray-500">{error.itemName || error.itemId}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-between">
          {errors.length > 0 && (
            <button 
              type="button" 
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-600 hover:bg-red-50 sm:text-sm"
              onClick={onClear}
            >
              <Trash2 size={16} className="mr-2" />
              Clear Logs
            </button>
          )}
          <button 
            type="button" 
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-white hover:bg-gray-700 sm:text-sm ml-auto"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
    <svg className="w-12 h-12 text-green-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


