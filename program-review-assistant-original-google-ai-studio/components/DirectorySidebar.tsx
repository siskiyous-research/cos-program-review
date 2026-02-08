
import React, { useState, useCallback } from 'react';
import { HistoricalData, HistoricalReview } from '../types';
import { FolderIcon } from './icons/FolderIcon';
import { FileIcon } from './icons/FileIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { UploadIcon } from './icons/UploadIcon';
import { PROGRAM_LIST } from '../constants';

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


export const DirectorySidebar: React.FC<DirectorySidebarProps> = ({ isOpen, onToggle, historicalData, currentProgram, onAddReview }) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ [currentProgram]: true });
  const [isDragging, setIsDragging] = useState(false);

  const toggleFolder = (programName: string) => {
    setOpenFolders(prev => ({ ...prev, [programName]: !prev[programName] }));
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
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (const file of files) {
        const { programName, year } = parseFileInfo(file.name);
        if (programName && year) {
          const reader = new FileReader();
          const fileUrl = URL.createObjectURL(file); // Create the object URL

          reader.onload = (event) => {
            const content = event.target?.result as string;
            const newReview: HistoricalReview = {
              year,
              type: file.name.toLowerCase().includes('comprehensive') ? 'Comprehensive' : 'Annual',
              title: file.name,
              content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // Truncate content for display
              url: fileUrl,
            };
            onAddReview(programName, newReview);
          };
          reader.readAsText(file);
        } else {
            // Handle cases where program name couldn't be parsed
            console.warn(`Could not determine program for file: ${file.name}`);
        }
      }
    }
  }, [onAddReview]);


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
      className="relative w-full md:w-1/4 xl:w-1/5 bg-slate-800 text-slate-300 flex flex-col h-full max-h-screen transition-all duration-300"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center border-2 border-dashed border-sky-400 rounded-md">
           <UploadIcon className="w-12 h-12 text-sky-400 mb-4" />
           <p className="text-lg font-semibold text-white">Drop to Upload</p>
           <p className="text-sm text-slate-400">Add to the knowledge base</p>
        </div>
      )}
      <header className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Review Archive</h3>
        <button onClick={onToggle} className="text-slate-300 hover:text-white" aria-label="Close review archive">
          <ChevronRightIcon className="w-6 h-6 transform rotate-180" />
        </button>
      </header>

      <div className="p-3 border-b border-slate-700">
        <div className="group cursor-pointer text-center text-slate-400 p-3 rounded-md border-2 border-dashed border-slate-600 hover:border-sky-500 hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center justify-center gap-2">
                <UploadIcon className="w-5 h-5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                <span className="font-semibold text-sm text-slate-300 group-hover:text-white">
                    Add/Drop Your Program Reviews
                </span>
            </div>
        </div>
      </div>

      <div className="flex-1 p-2 overflow-y-auto">
        <nav className="space-y-1">
          {Object.entries(historicalData).map(([programName, reviews]) => (
            <div key={programName}>
              <button
                onClick={() => toggleFolder(programName)}
                className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors ${
                  programName === currentProgram ? 'bg-slate-700 text-white' : 'hover:bg-slate-700'
                }`}
              >
                <ChevronRightIcon className={`w-4 h-4 transition-transform ${openFolders[programName] ? 'rotate-90' : ''}`} />
                <FolderIcon className="w-5 h-5 text-sky-400" />
                <span className="flex-1 truncate">{programName}</span>
              </button>
              {openFolders[programName] && (
                <div className="pl-6 mt-1 space-y-1">
                  {reviews.map(review => {
                    const fileItemContent = (
                      <>
                        <FileIcon className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{review.title}</span>
                      </>
                    );

                    if (review.url) {
                      return (
                        <a
                          key={review.title}
                          href={review.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer hover:bg-slate-700/50"
                          title={review.content}
                        >
                          {fileItemContent}
                        </a>
                      );
                    }
                    
                    return (
                       <div 
                         key={review.title} 
                         className="flex items-center gap-2 p-2 rounded-md text-sm cursor-not-allowed text-slate-500"
                         title={review.content}
                       >
                         {fileItemContent}
                       </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};