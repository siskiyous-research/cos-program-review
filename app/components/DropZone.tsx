'use client';

import { useState, useCallback, useRef } from 'react';

interface DropZoneProps {
  onFileDrop: (files: File[]) => void;
  isProcessing: boolean;
}

const ACCEPTED = '.pdf,.docx,.doc,.pptx,.xlsx,.xls,.csv';

export function DropZone({ onFileDrop, isProcessing }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFileDrop(files);
  }, [onFileDrop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onFileDrop(files);
    e.target.value = '';
  }, [onFileDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        isProcessing
          ? 'border-blue-300 bg-blue-50 cursor-wait'
          : isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFileSelect}
        className="hidden"
      />
      {isProcessing ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-blue-600 font-medium">Processing file...</p>
        </div>
      ) : (
        <>
          <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
          </svg>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-blue-600">Drop an existing review here</span> or click to browse
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PDF, Word, PowerPoint, Excel, CSV — content will be extracted into the first section
          </p>
        </>
      )}
    </div>
  );
}
