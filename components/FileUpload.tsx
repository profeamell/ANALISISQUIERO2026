
import React, { useRef } from 'react';

interface FileUploadProps {
  label: string;
  description: string;
  accept: string;
  onFileSelect: (file: File | null) => void;
  selectedFileName?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  description, 
  accept, 
  onFileSelect,
  selectedFileName 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect(file);
  };

  return (
    <div 
      onClick={handleContainerClick}
      className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer group
        ${selectedFileName ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
    >
      <input 
        type="file" 
        ref={inputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <div className="flex flex-col items-center text-center space-y-2">
        <div className={`p-3 rounded-full transition-colors 
          ${selectedFileName ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-700">{label}</span>
          <span className="text-sm text-slate-500">{description}</span>
        </div>
        {selectedFileName && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
            {selectedFileName}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
