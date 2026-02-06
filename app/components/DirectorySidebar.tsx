'use client';

import { useState, useCallback } from 'react';
import { HistoricalData, HistoricalReview } from '@/lib/types';
import { FolderIcon } from './icons/FolderIcon';
import { FileIcon } from './icons/FileIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { PROGRAM_LIST } from '@/lib/constants';

interface DirectorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  historicalData: HistoricalData;
  currentProgram: string;
  onAddReview: (programName: string, review: HistoricalReview) => void;
}

const allPrograms = Object.values(PROGRAM_LIST).flat();

const parseFileInfo = (fileName: string): { programName: string | null; year: number | null } => {
  let programName: string | null = null;
  for (const prog of allPrograms) {
    if (fileName.toLowerCase().includes(prog.toLowerCase())) {
      programName = prog;
      break;
    }
  }

  const yearMatch = fileName.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  return { programName, year };
};

export const DirectorySidebar: React.FC<DirectorySidebarProps> = ({
  isOpen,
  onToggle,
  historicalData,
  currentProgram,
  onAddReview,
}) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    [currentProgram]: true,
  });
  const [isDragging, setIsDragging] = useState(false);

  const toggleFolder = (programName: string) => {
    setOpenFolders((prev) => ({ ...prev, [programName]: !prev[programName] }));
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        for (const file of files) {
          const { programName, year } = parseFileInfo(file.name);
          if (programName && year) {
            const reader = new FileReader();

            reader.onload = (event) => {
              const content = event.target?.result as string;
              const newReview: HistoricalReview = {
                year,
                type: file.name.toLowerCase().includes('comprehensive') ? 'Comprehensive' : 'Annual',
                title: file.name,
                content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
              };
              onAddReview(programName, newReview);
            };
            reader.readAsText(file);
          } else {
            console.warn(`Could not determine program for file: ${file.name}`);
          }
        }
      }
    },
    [onAddReview]
  );

  if (!isOpen) {
    return (
      <div className="bg-slate-800 p-2">
        <button onClick={onToggle} className="text-slate-300 hover:text-white" aria-label="Open review archive">
          <ChevronRightIcon className="w-6 h-6 transform rotate-0" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-800 w-64 flex flex-col overflow-hidden transition-colors ${
        isDragging ? 'bg-slate-700' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-white font-semibold">Review Archive</h2>
        <button onClick={onToggle} className="text-slate-400 hover:text-slate-200">
          <ChevronRightIcon className="w-5 h-5 transform rotate-180" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isDragging && (
          <div className="p-4 text-center text-slate-300 border-2 border-dashed border-slate-500 m-4 rounded-lg">
            <p className="text-sm">Drop files to add reviews</p>
          </div>
        )}

        {!isDragging && (
          <div className="p-4 space-y-2">
            {allPrograms.map((program) => {
              const reviews = historicalData[program] || [];
              const isOpen = openFolders[program];

              return (
                <div key={program}>
                  <button
                    onClick={() => toggleFolder(program)}
                    className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm font-medium transition-colors ${
                      program === currentProgram
                        ? 'bg-slate-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <ChevronRightIcon
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                    <FolderIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{program}</span>
                    {reviews.length > 0 && (
                      <span className="ml-auto text-xs bg-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">
                        {reviews.length}
                      </span>
                    )}
                  </button>

                  {isOpen &&
                    reviews.map((review) => (
                      <div key={`${program}-${review.year}`} className="ml-6 p-2 text-xs text-slate-400">
                        <div className="flex items-start gap-2">
                          <FileIcon className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-300 truncate">{review.title}</p>
                            <p className="text-slate-500">
                              {review.year} ({review.type})
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">Drag & drop program review files to add them</p>
      </div>
    </div>
  );
};
