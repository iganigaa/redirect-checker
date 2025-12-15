'use client';

import React, { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileLoaded: (content: string, fileName: string) => void;
  accept: string;
  label: string;
  subLabel?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded, accept, label, subLabel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept={accept} 
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            {accept.includes('csv') ? <FileText size={32} /> : <Upload size={32} />}
        </div>
        <div className="space-y-1">
            <h3 className="text-lg font-medium text-gray-900">{label}</h3>
            {subLabel && <p className="text-sm text-gray-500">{subLabel}</p>}
        </div>
      </div>
    </div>
  );
};




